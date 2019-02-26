/* exported readConfig */

function readConfig(name) {
  if (!window.basiqConfig) {
    return null;
  }
  for (var i = 0; i <= window.basiqConfig.length; i++) {
    if (window.basiqConfig[i].name == name) {
      return window.basiqConfig[i].value;
    }
  }
  return null;
}
