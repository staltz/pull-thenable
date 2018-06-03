var pull = require('pull-stream');
var test = require('tape');
var thenable = require('./index');

function delay() {
  return pull.asyncMap(function(x, cb) {
    setTimeout(function() {
      cb(null, x);
    }, 100);
  });
}

test('consume 4 sync values with a chain of then', function(t) {
  t.plan(4);
  var expected = [10, 20, 30, 40];
  var readable = pull(pull.values([1, 2, 3, 4]), pull.map(x => x * 10));

  const source = thenable(readable);

  const checkNext = x => {
    const e = expected.shift();
    t.equals(x, e, 'should be ' + e);
    return source;
  };

  const shouldNotHappen = _ => {
    t.fail('this should not happen');
  };

  const shouldReject = e => {
    if (e === true) t.end();
    else t.fail('rejection was unexpected: ' + e);
  };

  source
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(shouldNotHappen, shouldReject);
});

test('consume 4 async values with a chain of then', function(t) {
  t.plan(4);
  var expected = [10, 20, 30, 40];
  var readable = pull(
    pull.values([1, 2, 3, 4]),
    delay(),
    pull.map(x => x * 10),
  );

  const source = thenable(readable);

  const checkNext = x => {
    const e = expected.shift();
    t.equals(x, e, 'should be ' + e);
    return source;
  };

  const shouldNotHappen = _ => {
    t.fail('this should not happen');
  };

  const shouldReject = e => {
    if (e === true) t.end();
    else t.fail('rejection was unexpected: ' + e);
  };

  source
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(checkNext, shouldNotHappen)
    .then(shouldNotHappen, shouldReject);
});

test('consume 4 sync values with async-await', async function(t) {
  var expected = [10, 20, 30, 40];
  var readable = pull(pull.values([1, 2, 3, 4]), pull.map(x => x * 10));
  while (true) {
    try {
      const x = await thenable(readable);
      const e = expected.shift();
      t.equals(x, e, 'should be ' + e);
    } catch (err) {
      if (err === true) {
        t.end();
        return;
      }
    }
  }
});

test('consume 4 async values with async-await', async function(t) {
  var expected = [10, 20, 30, 40];
  var readable = pull(
    pull.values([1, 2, 3, 4]),
    delay(),
    pull.map(x => x * 10),
  );
  while (true) {
    try {
      const x = await thenable(readable);
      const e = expected.shift();
      t.equals(x, e, 'should be ' + e);
    } catch (err) {
      if (err === true) {
        t.end();
        return;
      }
    }
  }
});

test('propagates error', async function(t) {
  var expected = [10, 20];
  var readable = pull(
    pull.values([1, 2, 3, 4]),
    pull.asyncMap((x, cb) => {
      if (x === 3) cb(new Error('bad stuff'));
      else cb(null, x);
    }),
    pull.map(x => x * 10),
  );
  const source = thenable(readable);
  while (true) {
    try {
      const x = await source;
      const e = expected.shift();
      t.equals(x, e, 'should be ' + e);
    } catch (err) {
      t.equals(err.message, 'bad stuff', 'error says "bad stuff"');
      t.equals(expected.length, 0, 'no more values expected to come');
      t.end();
      return;
    }
  }
});
