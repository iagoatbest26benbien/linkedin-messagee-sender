module.exports = {
  appId: 'com.linkedin.message.sender',
  productName: 'LinkedIn Message Sender',
  directories: {
    output: 'release'
  },
  files: [
    'dist/**/*',
    'package.json'
  ],
  win: {
    target: 'nsis',
    icon: 'src/renderer/public/icon.ico'
  },
  mac: {
    target: 'dmg',
    icon: 'src/renderer/public/icon.icns'
  },
  linux: {
    target: 'AppImage',
    icon: 'src/renderer/public/icon.png'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  }
}; 