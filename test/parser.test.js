import test from 'node:test';
import assert from 'node:assert/strict';
import Parser from '../src/modules/Parser.js';

test('Parser returns content for plain text message', () => {
  const parser = new Parser({}, 'Hello world');
  assert.deepEqual(parser.result(), { content: 'Hello world' });
});

test('Parser parses valid JSON string message', () => {
  const parser = new Parser({}, JSON.stringify({ content: 'test', embeds: [{ title: 'hello' }] }));
  assert.deepEqual(parser.result(), { content: 'test', embeds: [{ title: 'hello' }] });
});

test('Parser falls back to content when JSON is invalid or non-object', () => {
  const parser1 = new Parser({}, '{ invalid json }');
  assert.deepEqual(parser1.result(), { content: '{ invalid json }' });

  const parser2 = new Parser({}, '12345');
  assert.deepEqual(parser2.result(), { content: '12345' });
});
