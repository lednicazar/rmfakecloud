// Stub de react-i18next para usar dentro del Web Worker
import React from 'react';
import i18n from 'i18next';

export function useTranslation(ns) {
  return {
    t: (key, options) => i18n.t(key, { ns, ...options }),
    i18n,
  };
}

export function withTranslation(ns) {
  return function(WrappedComponent) {
    return class WithTranslation extends React.Component {
      render() {
        const t = (key, options) => i18n.t(key, { ns, ...options });
        const props = {
          ...this.props,
          t,
          i18n,
        };
        
        return React.createElement(WrappedComponent, props);
      }
    };
  };
}

export const Trans = ({ children, i18nKey, ...props }) => {
  return children || i18n.t(i18nKey, props);
};
