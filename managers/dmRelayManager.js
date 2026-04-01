async function sendPlainDM(user, text) {
  try {
    await user.send(text);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  sendPlainDM
};
