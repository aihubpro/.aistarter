import { App, DirectiveBinding } from 'vue';

export default {
  install: (app: App) => {
    const fun = function (evt: any) {
      let target = evt.target as HTMLElement;
      if (target.nodeName === 'SPAN') {
        target = evt.target.parentNode as HTMLElement;
      }
      target.blur();
    };

    app.directive('btn', {
      mounted(el: HTMLElement) {
        el.addEventListener('focus', fun);
      },
      unmounted(el: HTMLElement) {
        el.removeEventListener('focus', fun);
      },
    });
  },
};
