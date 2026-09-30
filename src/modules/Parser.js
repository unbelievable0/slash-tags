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
      // ignore JSON parse errors
    }

    return { content: this.message };
  }
}

export default Parser;
