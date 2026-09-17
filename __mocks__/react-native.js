module.exports = {
  Platform: {
    OS: 'android',
    select: (obj) => obj.android || obj.default,
  },
  StyleSheet: {
    create: (styles) => styles,
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812 }),
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  Modal: 'Modal',
};
