class ApplicationCommandOption {
  constructor(data) {
    this.name = data.name;
    this.type = data.type;
    if (data.value) this.value = data.value;
    if (data.options) this.options = data.options.map(option => new ApplicationCommandOption(option));
    if (data.choices) this.choices = data.choices;
  }
}

module.exports = ApplicationCommandOption;
