class Parser {
  constructor(context, message) {
    this.context = context;
    this.message = message;
  }

  result() {
    try {
      const parsed = JSON.parse(this.message);
      if (typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
    }

    return { content: this.message };
  }
}

module.exports = Parser;
