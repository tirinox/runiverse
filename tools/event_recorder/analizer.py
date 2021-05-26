from copy import deepcopy


class ListAnalyzer:
    def __init__(self, key_fuction=None, significant_keys=None, need_sort=True):
        self._old = {}
        self.key_function = key_fuction
        self.significant_keys = set(significant_keys or [])
        self.need_sort = need_sort

    def reset(self):
        self._old = {}

    def _compare_significant_changes(self, common_key, old_item, new_item):
        if not isinstance(old_item, dict) or not isinstance(new_item, dict):
            return 'type mismatch'
        else:
            result = []
            for k, new_v in new_item.items():
                if k in self.significant_keys:
                    old_v = old_item.get(k)
                    if new_v != old_v:
                        result.append({
                            'common_key': common_key,
                            'key': k, 'old': old_v, 'new': new_v
                        })
            return result

    def _analyze(self, new_dic: dict):
        new_items_ids = set(list(new_dic.keys()))
        old_items_ids = set(list(self._old.keys()))
        added_items_ids = new_items_ids - old_items_ids
        removed_items_ids = old_items_ids - new_items_ids
        common_items_ids = new_items_ids & old_items_ids

        result_changed = []

        for key in new_dic.keys():
            if key in common_items_ids:
                old_item = self._old[key]
                new_item = new_dic[key]
                # changes = self._compare_significant_changes(key, old_item, new_item)
                # result_changed += changes
                if old_item != new_item:
                    result_changed.append(new_item)

        return {
            'added': list(new_dic[k] for k in added_items_ids),
            'removed': list(self._old[k] for k in removed_items_ids),
            'changed': result_changed
        }

    def _to_dic(self, items) -> dict:
        results = {}
        for item in items:
            key = self.key_function(item)
            if not key:
                print(f'👺 Warning! Analyzer discards: {item}!')
                continue
            results[key] = item
        return results

    def feed(self, new_list):
        new_list = deepcopy(new_list)
        if isinstance(new_list, list) and self.key_function:
            if self.need_sort:
                new_list.sort(key=self.key_function)
            new_dic = self._to_dic(new_list)
            result = self._analyze(new_dic)
            self._old = new_dic
            return result
        else:
            raise ValueError('must be a list')
