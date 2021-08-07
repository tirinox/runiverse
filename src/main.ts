import {createApp} from 'vue'
import App from './App.vue'
import mitt from 'mitt';

import {library} from "@fortawesome/fontawesome-svg-core";
import {faFastBackward, faPause, faPlay, faStepBackward, faStepForward,} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/vue-fontawesome";
import {Cache} from "three";

library.add(faPlay);
library.add(faPause);
library.add(faStepBackward);
library.add(faStepForward);
library.add(faFastBackward);

Cache.enabled = true

const emitter = mitt();
const app = createApp(App);
app.component('font-awesome-icon', FontAwesomeIcon)
app.config.globalProperties.emitter = emitter;
app.mount('#app')
