var path = require('path');
module.exports = {
  entry: ['./public/js/gui.js', './node_modules/nexusui/dist/NexusUI.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/dist'
  }
};
