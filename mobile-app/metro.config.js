const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// HTTP 요청 허용 설정
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;