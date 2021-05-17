from deepdiff import diff
from copy import deepcopy


class Analyzer:
    def __init__(self, sort_function=None):
        self.old_object = []
        self.sort_function = sort_function

    def reset(self):
        self.old_object = []

    def feed(self, json_object):
        new_object = deepcopy(json_object)
        if isinstance(new_object, list) and self.sort_function:
            new_object.sort(key=self.sort_function)

        if self.old_object:
            comp = diff.DeepDiff(self.old_object, new_object)
            return comp
        self.old_object = json_object
