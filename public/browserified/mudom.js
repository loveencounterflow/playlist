require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
'use strict';

var possibleNames = [
	'BigInt64Array',
	'BigUint64Array',
	'Float32Array',
	'Float64Array',
	'Int16Array',
	'Int32Array',
	'Int8Array',
	'Uint16Array',
	'Uint32Array',
	'Uint8Array',
	'Uint8ClampedArray'
];

var g = typeof globalThis === 'undefined' ? global : globalThis;

module.exports = function availableTypedArrays() {
	var out = [];
	for (var i = 0; i < possibleNames.length; i++) {
		if (typeof g[possibleNames[i]] === 'function') {
			out[out.length] = possibleNames[i];
		}
	}
	return out;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){

},{}],4:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)

},{"base64-js":2,"buffer":4,"ieee754":16}],5:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var callBind = require('./');

var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

module.exports = function callBoundIntrinsic(name, allowMissing) {
	var intrinsic = GetIntrinsic(name, !!allowMissing);
	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.') > -1) {
		return callBind(intrinsic);
	}
	return intrinsic;
};

},{"./":6,"get-intrinsic":10}],6:[function(require,module,exports){
'use strict';

var bind = require('function-bind');
var GetIntrinsic = require('get-intrinsic');

var $apply = GetIntrinsic('%Function.prototype.apply%');
var $call = GetIntrinsic('%Function.prototype.call%');
var $reflectApply = GetIntrinsic('%Reflect.apply%', true) || bind.call($call, $apply);

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);
var $defineProperty = GetIntrinsic('%Object.defineProperty%', true);
var $max = GetIntrinsic('%Math.max%');

if ($defineProperty) {
	try {
		$defineProperty({}, 'a', { value: 1 });
	} catch (e) {
		// IE 8 has a broken defineProperty
		$defineProperty = null;
	}
}

module.exports = function callBind(originalFunction) {
	var func = $reflectApply(bind, $call, arguments);
	if ($gOPD && $defineProperty) {
		var desc = $gOPD(func, 'length');
		if (desc.configurable) {
			// original length, plus the receiver, minus any additional arguments (after the receiver)
			$defineProperty(
				func,
				'length',
				{ value: 1 + $max(0, originalFunction.length - (arguments.length - 1)) }
			);
		}
	}
	return func;
};

var applyBind = function applyBind() {
	return $reflectApply(bind, $apply, arguments);
};

if ($defineProperty) {
	$defineProperty(module.exports, 'apply', { value: applyBind });
} else {
	module.exports.apply = applyBind;
}

},{"function-bind":9,"get-intrinsic":10}],7:[function(require,module,exports){
'use strict';

var isCallable = require('is-callable');

var toStr = Object.prototype.toString;
var hasOwnProperty = Object.prototype.hasOwnProperty;

var forEachArray = function forEachArray(array, iterator, receiver) {
    for (var i = 0, len = array.length; i < len; i++) {
        if (hasOwnProperty.call(array, i)) {
            if (receiver == null) {
                iterator(array[i], i, array);
            } else {
                iterator.call(receiver, array[i], i, array);
            }
        }
    }
};

var forEachString = function forEachString(string, iterator, receiver) {
    for (var i = 0, len = string.length; i < len; i++) {
        // no such thing as a sparse string.
        if (receiver == null) {
            iterator(string.charAt(i), i, string);
        } else {
            iterator.call(receiver, string.charAt(i), i, string);
        }
    }
};

var forEachObject = function forEachObject(object, iterator, receiver) {
    for (var k in object) {
        if (hasOwnProperty.call(object, k)) {
            if (receiver == null) {
                iterator(object[k], k, object);
            } else {
                iterator.call(receiver, object[k], k, object);
            }
        }
    }
};

var forEach = function forEach(list, iterator, thisArg) {
    if (!isCallable(iterator)) {
        throw new TypeError('iterator must be a function');
    }

    var receiver;
    if (arguments.length >= 3) {
        receiver = thisArg;
    }

    if (toStr.call(list) === '[object Array]') {
        forEachArray(list, iterator, receiver);
    } else if (typeof list === 'string') {
        forEachString(list, iterator, receiver);
    } else {
        forEachObject(list, iterator, receiver);
    }
};

module.exports = forEach;

},{"is-callable":20}],8:[function(require,module,exports){
'use strict';

/* eslint no-invalid-this: 1 */

var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],9:[function(require,module,exports){
'use strict';

var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":8}],10:[function(require,module,exports){
'use strict';

var undefined;

var $SyntaxError = SyntaxError;
var $Function = Function;
var $TypeError = TypeError;

// eslint-disable-next-line consistent-return
var getEvalledConstructor = function (expressionSyntax) {
	try {
		return $Function('"use strict"; return (' + expressionSyntax + ').constructor;')();
	} catch (e) {}
};

var $gOPD = Object.getOwnPropertyDescriptor;
if ($gOPD) {
	try {
		$gOPD({}, '');
	} catch (e) {
		$gOPD = null; // this is IE 8, which has a broken gOPD
	}
}

var throwTypeError = function () {
	throw new $TypeError();
};
var ThrowTypeError = $gOPD
	? (function () {
		try {
			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
			arguments.callee; // IE 8 does not throw here
			return throwTypeError;
		} catch (calleeThrows) {
			try {
				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
				return $gOPD(arguments, 'callee').get;
			} catch (gOPDthrows) {
				return throwTypeError;
			}
		}
	}())
	: throwTypeError;

var hasSymbols = require('has-symbols')();

var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto

var needsEval = {};

var TypedArray = typeof Uint8Array === 'undefined' ? undefined : getProto(Uint8Array);

var INTRINSICS = {
	'%AggregateError%': typeof AggregateError === 'undefined' ? undefined : AggregateError,
	'%Array%': Array,
	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined : ArrayBuffer,
	'%ArrayIteratorPrototype%': hasSymbols ? getProto([][Symbol.iterator]()) : undefined,
	'%AsyncFromSyncIteratorPrototype%': undefined,
	'%AsyncFunction%': needsEval,
	'%AsyncGenerator%': needsEval,
	'%AsyncGeneratorFunction%': needsEval,
	'%AsyncIteratorPrototype%': needsEval,
	'%Atomics%': typeof Atomics === 'undefined' ? undefined : Atomics,
	'%BigInt%': typeof BigInt === 'undefined' ? undefined : BigInt,
	'%BigInt64Array%': typeof BigInt64Array === 'undefined' ? undefined : BigInt64Array,
	'%BigUint64Array%': typeof BigUint64Array === 'undefined' ? undefined : BigUint64Array,
	'%Boolean%': Boolean,
	'%DataView%': typeof DataView === 'undefined' ? undefined : DataView,
	'%Date%': Date,
	'%decodeURI%': decodeURI,
	'%decodeURIComponent%': decodeURIComponent,
	'%encodeURI%': encodeURI,
	'%encodeURIComponent%': encodeURIComponent,
	'%Error%': Error,
	'%eval%': eval, // eslint-disable-line no-eval
	'%EvalError%': EvalError,
	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined : Float32Array,
	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined : Float64Array,
	'%FinalizationRegistry%': typeof FinalizationRegistry === 'undefined' ? undefined : FinalizationRegistry,
	'%Function%': $Function,
	'%GeneratorFunction%': needsEval,
	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined : Int8Array,
	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined : Int16Array,
	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined : Int32Array,
	'%isFinite%': isFinite,
	'%isNaN%': isNaN,
	'%IteratorPrototype%': hasSymbols ? getProto(getProto([][Symbol.iterator]())) : undefined,
	'%JSON%': typeof JSON === 'object' ? JSON : undefined,
	'%Map%': typeof Map === 'undefined' ? undefined : Map,
	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols ? undefined : getProto(new Map()[Symbol.iterator]()),
	'%Math%': Math,
	'%Number%': Number,
	'%Object%': Object,
	'%parseFloat%': parseFloat,
	'%parseInt%': parseInt,
	'%Promise%': typeof Promise === 'undefined' ? undefined : Promise,
	'%Proxy%': typeof Proxy === 'undefined' ? undefined : Proxy,
	'%RangeError%': RangeError,
	'%ReferenceError%': ReferenceError,
	'%Reflect%': typeof Reflect === 'undefined' ? undefined : Reflect,
	'%RegExp%': RegExp,
	'%Set%': typeof Set === 'undefined' ? undefined : Set,
	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols ? undefined : getProto(new Set()[Symbol.iterator]()),
	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined : SharedArrayBuffer,
	'%String%': String,
	'%StringIteratorPrototype%': hasSymbols ? getProto(''[Symbol.iterator]()) : undefined,
	'%Symbol%': hasSymbols ? Symbol : undefined,
	'%SyntaxError%': $SyntaxError,
	'%ThrowTypeError%': ThrowTypeError,
	'%TypedArray%': TypedArray,
	'%TypeError%': $TypeError,
	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined : Uint8Array,
	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined : Uint8ClampedArray,
	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined : Uint16Array,
	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined : Uint32Array,
	'%URIError%': URIError,
	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined : WeakMap,
	'%WeakRef%': typeof WeakRef === 'undefined' ? undefined : WeakRef,
	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined : WeakSet
};

try {
	null.error; // eslint-disable-line no-unused-expressions
} catch (e) {
	// https://github.com/tc39/proposal-shadowrealm/pull/384#issuecomment-1364264229
	var errorProto = getProto(getProto(e));
	INTRINSICS['%Error.prototype%'] = errorProto;
}

var doEval = function doEval(name) {
	var value;
	if (name === '%AsyncFunction%') {
		value = getEvalledConstructor('async function () {}');
	} else if (name === '%GeneratorFunction%') {
		value = getEvalledConstructor('function* () {}');
	} else if (name === '%AsyncGeneratorFunction%') {
		value = getEvalledConstructor('async function* () {}');
	} else if (name === '%AsyncGenerator%') {
		var fn = doEval('%AsyncGeneratorFunction%');
		if (fn) {
			value = fn.prototype;
		}
	} else if (name === '%AsyncIteratorPrototype%') {
		var gen = doEval('%AsyncGenerator%');
		if (gen) {
			value = getProto(gen.prototype);
		}
	}

	INTRINSICS[name] = value;

	return value;
};

var LEGACY_ALIASES = {
	'%ArrayBufferPrototype%': ['ArrayBuffer', 'prototype'],
	'%ArrayPrototype%': ['Array', 'prototype'],
	'%ArrayProto_entries%': ['Array', 'prototype', 'entries'],
	'%ArrayProto_forEach%': ['Array', 'prototype', 'forEach'],
	'%ArrayProto_keys%': ['Array', 'prototype', 'keys'],
	'%ArrayProto_values%': ['Array', 'prototype', 'values'],
	'%AsyncFunctionPrototype%': ['AsyncFunction', 'prototype'],
	'%AsyncGenerator%': ['AsyncGeneratorFunction', 'prototype'],
	'%AsyncGeneratorPrototype%': ['AsyncGeneratorFunction', 'prototype', 'prototype'],
	'%BooleanPrototype%': ['Boolean', 'prototype'],
	'%DataViewPrototype%': ['DataView', 'prototype'],
	'%DatePrototype%': ['Date', 'prototype'],
	'%ErrorPrototype%': ['Error', 'prototype'],
	'%EvalErrorPrototype%': ['EvalError', 'prototype'],
	'%Float32ArrayPrototype%': ['Float32Array', 'prototype'],
	'%Float64ArrayPrototype%': ['Float64Array', 'prototype'],
	'%FunctionPrototype%': ['Function', 'prototype'],
	'%Generator%': ['GeneratorFunction', 'prototype'],
	'%GeneratorPrototype%': ['GeneratorFunction', 'prototype', 'prototype'],
	'%Int8ArrayPrototype%': ['Int8Array', 'prototype'],
	'%Int16ArrayPrototype%': ['Int16Array', 'prototype'],
	'%Int32ArrayPrototype%': ['Int32Array', 'prototype'],
	'%JSONParse%': ['JSON', 'parse'],
	'%JSONStringify%': ['JSON', 'stringify'],
	'%MapPrototype%': ['Map', 'prototype'],
	'%NumberPrototype%': ['Number', 'prototype'],
	'%ObjectPrototype%': ['Object', 'prototype'],
	'%ObjProto_toString%': ['Object', 'prototype', 'toString'],
	'%ObjProto_valueOf%': ['Object', 'prototype', 'valueOf'],
	'%PromisePrototype%': ['Promise', 'prototype'],
	'%PromiseProto_then%': ['Promise', 'prototype', 'then'],
	'%Promise_all%': ['Promise', 'all'],
	'%Promise_reject%': ['Promise', 'reject'],
	'%Promise_resolve%': ['Promise', 'resolve'],
	'%RangeErrorPrototype%': ['RangeError', 'prototype'],
	'%ReferenceErrorPrototype%': ['ReferenceError', 'prototype'],
	'%RegExpPrototype%': ['RegExp', 'prototype'],
	'%SetPrototype%': ['Set', 'prototype'],
	'%SharedArrayBufferPrototype%': ['SharedArrayBuffer', 'prototype'],
	'%StringPrototype%': ['String', 'prototype'],
	'%SymbolPrototype%': ['Symbol', 'prototype'],
	'%SyntaxErrorPrototype%': ['SyntaxError', 'prototype'],
	'%TypedArrayPrototype%': ['TypedArray', 'prototype'],
	'%TypeErrorPrototype%': ['TypeError', 'prototype'],
	'%Uint8ArrayPrototype%': ['Uint8Array', 'prototype'],
	'%Uint8ClampedArrayPrototype%': ['Uint8ClampedArray', 'prototype'],
	'%Uint16ArrayPrototype%': ['Uint16Array', 'prototype'],
	'%Uint32ArrayPrototype%': ['Uint32Array', 'prototype'],
	'%URIErrorPrototype%': ['URIError', 'prototype'],
	'%WeakMapPrototype%': ['WeakMap', 'prototype'],
	'%WeakSetPrototype%': ['WeakSet', 'prototype']
};

var bind = require('function-bind');
var hasOwn = require('has');
var $concat = bind.call(Function.call, Array.prototype.concat);
var $spliceApply = bind.call(Function.apply, Array.prototype.splice);
var $replace = bind.call(Function.call, String.prototype.replace);
var $strSlice = bind.call(Function.call, String.prototype.slice);
var $exec = bind.call(Function.call, RegExp.prototype.exec);

/* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
var stringToPath = function stringToPath(string) {
	var first = $strSlice(string, 0, 1);
	var last = $strSlice(string, -1);
	if (first === '%' && last !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected closing `%`');
	} else if (last === '%' && first !== '%') {
		throw new $SyntaxError('invalid intrinsic syntax, expected opening `%`');
	}
	var result = [];
	$replace(string, rePropName, function (match, number, quote, subString) {
		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : number || match;
	});
	return result;
};
/* end adaptation */

var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
	var intrinsicName = name;
	var alias;
	if (hasOwn(LEGACY_ALIASES, intrinsicName)) {
		alias = LEGACY_ALIASES[intrinsicName];
		intrinsicName = '%' + alias[0] + '%';
	}

	if (hasOwn(INTRINSICS, intrinsicName)) {
		var value = INTRINSICS[intrinsicName];
		if (value === needsEval) {
			value = doEval(intrinsicName);
		}
		if (typeof value === 'undefined' && !allowMissing) {
			throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
		}

		return {
			alias: alias,
			name: intrinsicName,
			value: value
		};
	}

	throw new $SyntaxError('intrinsic ' + name + ' does not exist!');
};

module.exports = function GetIntrinsic(name, allowMissing) {
	if (typeof name !== 'string' || name.length === 0) {
		throw new $TypeError('intrinsic name must be a non-empty string');
	}
	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
		throw new $TypeError('"allowMissing" argument must be a boolean');
	}

	if ($exec(/^%?[^%]*%?$/, name) === null) {
		throw new $SyntaxError('`%` may not be present anywhere but at the beginning and end of the intrinsic name');
	}
	var parts = stringToPath(name);
	var intrinsicBaseName = parts.length > 0 ? parts[0] : '';

	var intrinsic = getBaseIntrinsic('%' + intrinsicBaseName + '%', allowMissing);
	var intrinsicRealName = intrinsic.name;
	var value = intrinsic.value;
	var skipFurtherCaching = false;

	var alias = intrinsic.alias;
	if (alias) {
		intrinsicBaseName = alias[0];
		$spliceApply(parts, $concat([0, 1], alias));
	}

	for (var i = 1, isOwn = true; i < parts.length; i += 1) {
		var part = parts[i];
		var first = $strSlice(part, 0, 1);
		var last = $strSlice(part, -1);
		if (
			(
				(first === '"' || first === "'" || first === '`')
				|| (last === '"' || last === "'" || last === '`')
			)
			&& first !== last
		) {
			throw new $SyntaxError('property names with quotes must have matching quotes');
		}
		if (part === 'constructor' || !isOwn) {
			skipFurtherCaching = true;
		}

		intrinsicBaseName += '.' + part;
		intrinsicRealName = '%' + intrinsicBaseName + '%';

		if (hasOwn(INTRINSICS, intrinsicRealName)) {
			value = INTRINSICS[intrinsicRealName];
		} else if (value != null) {
			if (!(part in value)) {
				if (!allowMissing) {
					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
				}
				return void undefined;
			}
			if ($gOPD && (i + 1) >= parts.length) {
				var desc = $gOPD(value, part);
				isOwn = !!desc;

				// By convention, when a data property is converted to an accessor
				// property to emulate a data property that does not suffer from
				// the override mistake, that accessor's getter is marked with
				// an `originalValue` property. Here, when we detect this, we
				// uphold the illusion by pretending to see that original data
				// property, i.e., returning the value rather than the getter
				// itself.
				if (isOwn && 'get' in desc && !('originalValue' in desc.get)) {
					value = desc.get;
				} else {
					value = value[part];
				}
			} else {
				isOwn = hasOwn(value, part);
				value = value[part];
			}

			if (isOwn && !skipFurtherCaching) {
				INTRINSICS[intrinsicRealName] = value;
			}
		}
	}
	return value;
};

},{"function-bind":9,"has":15,"has-symbols":12}],11:[function(require,module,exports){
'use strict';

var GetIntrinsic = require('get-intrinsic');

var $gOPD = GetIntrinsic('%Object.getOwnPropertyDescriptor%', true);

if ($gOPD) {
	try {
		$gOPD([], 'length');
	} catch (e) {
		// IE 8 has a broken gOPD
		$gOPD = null;
	}
}

module.exports = $gOPD;

},{"get-intrinsic":10}],12:[function(require,module,exports){
'use strict';

var origSymbol = typeof Symbol !== 'undefined' && Symbol;
var hasSymbolSham = require('./shams');

module.exports = function hasNativeSymbols() {
	if (typeof origSymbol !== 'function') { return false; }
	if (typeof Symbol !== 'function') { return false; }
	if (typeof origSymbol('foo') !== 'symbol') { return false; }
	if (typeof Symbol('bar') !== 'symbol') { return false; }

	return hasSymbolSham();
};

},{"./shams":13}],13:[function(require,module,exports){
'use strict';

/* eslint complexity: [2, 18], max-statements: [2, 33] */
module.exports = function hasSymbols() {
	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
	if (typeof Symbol.iterator === 'symbol') { return true; }

	var obj = {};
	var sym = Symbol('test');
	var symObj = Object(sym);
	if (typeof sym === 'string') { return false; }

	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

	// temp disabled per https://github.com/ljharb/object.assign/issues/17
	// if (sym instanceof Symbol) { return false; }
	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
	// if (!(symObj instanceof Symbol)) { return false; }

	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

	var symVal = 42;
	obj[sym] = symVal;
	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax, no-unreachable-loop
	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

	var syms = Object.getOwnPropertySymbols(obj);
	if (syms.length !== 1 || syms[0] !== sym) { return false; }

	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

	if (typeof Object.getOwnPropertyDescriptor === 'function') {
		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
	}

	return true;
};

},{}],14:[function(require,module,exports){
'use strict';

var hasSymbols = require('has-symbols/shams');

module.exports = function hasToStringTagShams() {
	return hasSymbols() && !!Symbol.toStringTag;
};

},{"has-symbols/shams":13}],15:[function(require,module,exports){
'use strict';

var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":9}],16:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],17:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],18:[function(require,module,exports){
'use strict';

var hasToStringTag = require('has-tostringtag/shams')();
var callBound = require('call-bind/callBound');

var $toString = callBound('Object.prototype.toString');

var isStandardArguments = function isArguments(value) {
	if (hasToStringTag && value && typeof value === 'object' && Symbol.toStringTag in value) {
		return false;
	}
	return $toString(value) === '[object Arguments]';
};

var isLegacyArguments = function isArguments(value) {
	if (isStandardArguments(value)) {
		return true;
	}
	return value !== null &&
		typeof value === 'object' &&
		typeof value.length === 'number' &&
		value.length >= 0 &&
		$toString(value) !== '[object Array]' &&
		$toString(value.callee) === '[object Function]';
};

var supportsStandardArguments = (function () {
	return isStandardArguments(arguments);
}());

isStandardArguments.isLegacyArguments = isLegacyArguments; // for tests

module.exports = supportsStandardArguments ? isStandardArguments : isLegacyArguments;

},{"call-bind/callBound":5,"has-tostringtag/shams":14}],19:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],20:[function(require,module,exports){
'use strict';

var fnToStr = Function.prototype.toString;
var reflectApply = typeof Reflect === 'object' && Reflect !== null && Reflect.apply;
var badArrayLike;
var isCallableMarker;
if (typeof reflectApply === 'function' && typeof Object.defineProperty === 'function') {
	try {
		badArrayLike = Object.defineProperty({}, 'length', {
			get: function () {
				throw isCallableMarker;
			}
		});
		isCallableMarker = {};
		// eslint-disable-next-line no-throw-literal
		reflectApply(function () { throw 42; }, null, badArrayLike);
	} catch (_) {
		if (_ !== isCallableMarker) {
			reflectApply = null;
		}
	}
} else {
	reflectApply = null;
}

var constructorRegex = /^\s*class\b/;
var isES6ClassFn = function isES6ClassFunction(value) {
	try {
		var fnStr = fnToStr.call(value);
		return constructorRegex.test(fnStr);
	} catch (e) {
		return false; // not a function
	}
};

var tryFunctionObject = function tryFunctionToStr(value) {
	try {
		if (isES6ClassFn(value)) { return false; }
		fnToStr.call(value);
		return true;
	} catch (e) {
		return false;
	}
};
var toStr = Object.prototype.toString;
var objectClass = '[object Object]';
var fnClass = '[object Function]';
var genClass = '[object GeneratorFunction]';
var ddaClass = '[object HTMLAllCollection]'; // IE 11
var ddaClass2 = '[object HTML document.all class]';
var ddaClass3 = '[object HTMLCollection]'; // IE 9-10
var hasToStringTag = typeof Symbol === 'function' && !!Symbol.toStringTag; // better: use `has-tostringtag`

var isIE68 = !(0 in [,]); // eslint-disable-line no-sparse-arrays, comma-spacing

var isDDA = function isDocumentDotAll() { return false; };
if (typeof document === 'object') {
	// Firefox 3 canonicalizes DDA to undefined when it's not accessed directly
	var all = document.all;
	if (toStr.call(all) === toStr.call(document.all)) {
		isDDA = function isDocumentDotAll(value) {
			/* globals document: false */
			// in IE 6-8, typeof document.all is "object" and it's truthy
			if ((isIE68 || !value) && (typeof value === 'undefined' || typeof value === 'object')) {
				try {
					var str = toStr.call(value);
					return (
						str === ddaClass
						|| str === ddaClass2
						|| str === ddaClass3 // opera 12.16
						|| str === objectClass // IE 6-8
					) && value('') == null; // eslint-disable-line eqeqeq
				} catch (e) { /**/ }
			}
			return false;
		};
	}
}

module.exports = reflectApply
	? function isCallable(value) {
		if (isDDA(value)) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		try {
			reflectApply(value, null, badArrayLike);
		} catch (e) {
			if (e !== isCallableMarker) { return false; }
		}
		return !isES6ClassFn(value) && tryFunctionObject(value);
	}
	: function isCallable(value) {
		if (isDDA(value)) { return true; }
		if (!value) { return false; }
		if (typeof value !== 'function' && typeof value !== 'object') { return false; }
		if (hasToStringTag) { return tryFunctionObject(value); }
		if (isES6ClassFn(value)) { return false; }
		var strClass = toStr.call(value);
		if (strClass !== fnClass && strClass !== genClass && !(/^\[object HTML/).test(strClass)) { return false; }
		return tryFunctionObject(value);
	};

},{}],21:[function(require,module,exports){
'use strict';

var toStr = Object.prototype.toString;
var fnToStr = Function.prototype.toString;
var isFnRegex = /^\s*(?:function)?\*/;
var hasToStringTag = require('has-tostringtag/shams')();
var getProto = Object.getPrototypeOf;
var getGeneratorFunc = function () { // eslint-disable-line consistent-return
	if (!hasToStringTag) {
		return false;
	}
	try {
		return Function('return function*() {}')();
	} catch (e) {
	}
};
var GeneratorFunction;

module.exports = function isGeneratorFunction(fn) {
	if (typeof fn !== 'function') {
		return false;
	}
	if (isFnRegex.test(fnToStr.call(fn))) {
		return true;
	}
	if (!hasToStringTag) {
		var str = toStr.call(fn);
		return str === '[object GeneratorFunction]';
	}
	if (!getProto) {
		return false;
	}
	if (typeof GeneratorFunction === 'undefined') {
		var generatorFunc = getGeneratorFunc();
		GeneratorFunction = generatorFunc ? getProto(generatorFunc) : false;
	}
	return getProto(fn) === GeneratorFunction;
};

},{"has-tostringtag/shams":14}],22:[function(require,module,exports){
'use strict';

var whichTypedArray = require('which-typed-array');

module.exports = function isTypedArray(value) {
	return !!whichTypedArray(value);
};

},{"which-typed-array":28}],23:[function(require,module,exports){
(function (process){(function (){
// 'path' module extracted from Node.js v8.11.1 (only the posix part)
// transplited with Babel

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSegmentLength = 0;
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47 /*/*/)
      break;
    else
      code = 47 /*/*/;
    if (code === 47 /*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
          if (res.length > 2) {
            var lastSlashIndex = res.lastIndexOf('/');
            if (lastSlashIndex !== res.length - 1) {
              if (lastSlashIndex === -1) {
                res = '';
                lastSegmentLength = 0;
              } else {
                res = res.slice(0, lastSlashIndex);
                lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
              }
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSegmentLength = 0;
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
        lastSegmentLength = i - lastSlash - 1;
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46 /*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },

  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0) return '.';

    var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute) path = '.';
    if (path.length > 0 && trailingSeparator) path += '/';

    if (isAbsolute) return '/' + path;
    return path;
  },

  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
  },

  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },

  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to) return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to) return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47 /*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = fromEnd - fromStart;

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47 /*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = toEnd - toStart;

    // Compare paths to find the longest common path from root
    var length = fromLen < toLen ? fromLen : toLen;
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47 /*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47 /*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47 /*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },

  _makeLong: function _makeLong(path) {
    return path;
  },

  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0) return '.';
    var code = path.charCodeAt(0);
    var hasRoot = code === 47 /*/*/;
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1) return hasRoot ? '/' : '.';
    if (hasRoot && end === 1) return '//';
    return path.slice(0, end);
  },

  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path) return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              start = i + 1;
              break;
            }
          } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1) return '';
      return path.slice(start, end);
    }
  },

  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1)
            startDot = i;
          else if (preDotState !== 1)
            preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      return '';
    }
    return path.slice(startDot, end);
  },

  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
    }
    return _format('/', pathObject);
  },

  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0) return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = code === 47 /*/*/;
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47 /*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            startPart = i + 1;
            break;
          }
          continue;
        }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46 /*.*/) {
          // If this is our first dot, mark it as the start of our extension
          if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 || end === -1 ||
    // We saw a non-dot character immediately before the dot
    preDotState === 0 ||
    // The (right-most) trimmed path component is exactly '..'
    preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';

    return ret;
  },

  sep: '/',
  delimiter: ':',
  win32: null,
  posix: null
};

posix.posix = posix;

module.exports = posix;

}).call(this)}).call(this,require('_process'))

},{"_process":24}],24:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],25:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],26:[function(require,module,exports){
// Currently in sync with Node.js lib/internal/util/types.js
// https://github.com/nodejs/node/commit/112cc7c27551254aa2b17098fb774867f05ed0d9

'use strict';

var isArgumentsObject = require('is-arguments');
var isGeneratorFunction = require('is-generator-function');
var whichTypedArray = require('which-typed-array');
var isTypedArray = require('is-typed-array');

function uncurryThis(f) {
  return f.call.bind(f);
}

var BigIntSupported = typeof BigInt !== 'undefined';
var SymbolSupported = typeof Symbol !== 'undefined';

var ObjectToString = uncurryThis(Object.prototype.toString);

var numberValue = uncurryThis(Number.prototype.valueOf);
var stringValue = uncurryThis(String.prototype.valueOf);
var booleanValue = uncurryThis(Boolean.prototype.valueOf);

if (BigIntSupported) {
  var bigIntValue = uncurryThis(BigInt.prototype.valueOf);
}

if (SymbolSupported) {
  var symbolValue = uncurryThis(Symbol.prototype.valueOf);
}

function checkBoxedPrimitive(value, prototypeValueOf) {
  if (typeof value !== 'object') {
    return false;
  }
  try {
    prototypeValueOf(value);
    return true;
  } catch(e) {
    return false;
  }
}

exports.isArgumentsObject = isArgumentsObject;
exports.isGeneratorFunction = isGeneratorFunction;
exports.isTypedArray = isTypedArray;

// Taken from here and modified for better browser support
// https://github.com/sindresorhus/p-is-promise/blob/cda35a513bda03f977ad5cde3a079d237e82d7ef/index.js
function isPromise(input) {
	return (
		(
			typeof Promise !== 'undefined' &&
			input instanceof Promise
		) ||
		(
			input !== null &&
			typeof input === 'object' &&
			typeof input.then === 'function' &&
			typeof input.catch === 'function'
		)
	);
}
exports.isPromise = isPromise;

function isArrayBufferView(value) {
  if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView) {
    return ArrayBuffer.isView(value);
  }

  return (
    isTypedArray(value) ||
    isDataView(value)
  );
}
exports.isArrayBufferView = isArrayBufferView;


function isUint8Array(value) {
  return whichTypedArray(value) === 'Uint8Array';
}
exports.isUint8Array = isUint8Array;

function isUint8ClampedArray(value) {
  return whichTypedArray(value) === 'Uint8ClampedArray';
}
exports.isUint8ClampedArray = isUint8ClampedArray;

function isUint16Array(value) {
  return whichTypedArray(value) === 'Uint16Array';
}
exports.isUint16Array = isUint16Array;

function isUint32Array(value) {
  return whichTypedArray(value) === 'Uint32Array';
}
exports.isUint32Array = isUint32Array;

function isInt8Array(value) {
  return whichTypedArray(value) === 'Int8Array';
}
exports.isInt8Array = isInt8Array;

function isInt16Array(value) {
  return whichTypedArray(value) === 'Int16Array';
}
exports.isInt16Array = isInt16Array;

function isInt32Array(value) {
  return whichTypedArray(value) === 'Int32Array';
}
exports.isInt32Array = isInt32Array;

function isFloat32Array(value) {
  return whichTypedArray(value) === 'Float32Array';
}
exports.isFloat32Array = isFloat32Array;

function isFloat64Array(value) {
  return whichTypedArray(value) === 'Float64Array';
}
exports.isFloat64Array = isFloat64Array;

function isBigInt64Array(value) {
  return whichTypedArray(value) === 'BigInt64Array';
}
exports.isBigInt64Array = isBigInt64Array;

function isBigUint64Array(value) {
  return whichTypedArray(value) === 'BigUint64Array';
}
exports.isBigUint64Array = isBigUint64Array;

function isMapToString(value) {
  return ObjectToString(value) === '[object Map]';
}
isMapToString.working = (
  typeof Map !== 'undefined' &&
  isMapToString(new Map())
);

function isMap(value) {
  if (typeof Map === 'undefined') {
    return false;
  }

  return isMapToString.working
    ? isMapToString(value)
    : value instanceof Map;
}
exports.isMap = isMap;

function isSetToString(value) {
  return ObjectToString(value) === '[object Set]';
}
isSetToString.working = (
  typeof Set !== 'undefined' &&
  isSetToString(new Set())
);
function isSet(value) {
  if (typeof Set === 'undefined') {
    return false;
  }

  return isSetToString.working
    ? isSetToString(value)
    : value instanceof Set;
}
exports.isSet = isSet;

function isWeakMapToString(value) {
  return ObjectToString(value) === '[object WeakMap]';
}
isWeakMapToString.working = (
  typeof WeakMap !== 'undefined' &&
  isWeakMapToString(new WeakMap())
);
function isWeakMap(value) {
  if (typeof WeakMap === 'undefined') {
    return false;
  }

  return isWeakMapToString.working
    ? isWeakMapToString(value)
    : value instanceof WeakMap;
}
exports.isWeakMap = isWeakMap;

function isWeakSetToString(value) {
  return ObjectToString(value) === '[object WeakSet]';
}
isWeakSetToString.working = (
  typeof WeakSet !== 'undefined' &&
  isWeakSetToString(new WeakSet())
);
function isWeakSet(value) {
  return isWeakSetToString(value);
}
exports.isWeakSet = isWeakSet;

function isArrayBufferToString(value) {
  return ObjectToString(value) === '[object ArrayBuffer]';
}
isArrayBufferToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  isArrayBufferToString(new ArrayBuffer())
);
function isArrayBuffer(value) {
  if (typeof ArrayBuffer === 'undefined') {
    return false;
  }

  return isArrayBufferToString.working
    ? isArrayBufferToString(value)
    : value instanceof ArrayBuffer;
}
exports.isArrayBuffer = isArrayBuffer;

function isDataViewToString(value) {
  return ObjectToString(value) === '[object DataView]';
}
isDataViewToString.working = (
  typeof ArrayBuffer !== 'undefined' &&
  typeof DataView !== 'undefined' &&
  isDataViewToString(new DataView(new ArrayBuffer(1), 0, 1))
);
function isDataView(value) {
  if (typeof DataView === 'undefined') {
    return false;
  }

  return isDataViewToString.working
    ? isDataViewToString(value)
    : value instanceof DataView;
}
exports.isDataView = isDataView;

// Store a copy of SharedArrayBuffer in case it's deleted elsewhere
var SharedArrayBufferCopy = typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined;
function isSharedArrayBufferToString(value) {
  return ObjectToString(value) === '[object SharedArrayBuffer]';
}
function isSharedArrayBuffer(value) {
  if (typeof SharedArrayBufferCopy === 'undefined') {
    return false;
  }

  if (typeof isSharedArrayBufferToString.working === 'undefined') {
    isSharedArrayBufferToString.working = isSharedArrayBufferToString(new SharedArrayBufferCopy());
  }

  return isSharedArrayBufferToString.working
    ? isSharedArrayBufferToString(value)
    : value instanceof SharedArrayBufferCopy;
}
exports.isSharedArrayBuffer = isSharedArrayBuffer;

function isAsyncFunction(value) {
  return ObjectToString(value) === '[object AsyncFunction]';
}
exports.isAsyncFunction = isAsyncFunction;

function isMapIterator(value) {
  return ObjectToString(value) === '[object Map Iterator]';
}
exports.isMapIterator = isMapIterator;

function isSetIterator(value) {
  return ObjectToString(value) === '[object Set Iterator]';
}
exports.isSetIterator = isSetIterator;

function isGeneratorObject(value) {
  return ObjectToString(value) === '[object Generator]';
}
exports.isGeneratorObject = isGeneratorObject;

function isWebAssemblyCompiledModule(value) {
  return ObjectToString(value) === '[object WebAssembly.Module]';
}
exports.isWebAssemblyCompiledModule = isWebAssemblyCompiledModule;

function isNumberObject(value) {
  return checkBoxedPrimitive(value, numberValue);
}
exports.isNumberObject = isNumberObject;

function isStringObject(value) {
  return checkBoxedPrimitive(value, stringValue);
}
exports.isStringObject = isStringObject;

function isBooleanObject(value) {
  return checkBoxedPrimitive(value, booleanValue);
}
exports.isBooleanObject = isBooleanObject;

function isBigIntObject(value) {
  return BigIntSupported && checkBoxedPrimitive(value, bigIntValue);
}
exports.isBigIntObject = isBigIntObject;

function isSymbolObject(value) {
  return SymbolSupported && checkBoxedPrimitive(value, symbolValue);
}
exports.isSymbolObject = isSymbolObject;

function isBoxedPrimitive(value) {
  return (
    isNumberObject(value) ||
    isStringObject(value) ||
    isBooleanObject(value) ||
    isBigIntObject(value) ||
    isSymbolObject(value)
  );
}
exports.isBoxedPrimitive = isBoxedPrimitive;

function isAnyArrayBuffer(value) {
  return typeof Uint8Array !== 'undefined' && (
    isArrayBuffer(value) ||
    isSharedArrayBuffer(value)
  );
}
exports.isAnyArrayBuffer = isAnyArrayBuffer;

['isProxy', 'isExternal', 'isModuleNamespaceObject'].forEach(function(method) {
  Object.defineProperty(exports, method, {
    enumerable: false,
    value: function() {
      throw new Error(method + ' is not supported in userland');
    }
  });
});

},{"is-arguments":18,"is-generator-function":21,"is-typed-array":22,"which-typed-array":28}],27:[function(require,module,exports){
(function (process){(function (){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors ||
  function getOwnPropertyDescriptors(obj) {
    var keys = Object.keys(obj);
    var descriptors = {};
    for (var i = 0; i < keys.length; i++) {
      descriptors[keys[i]] = Object.getOwnPropertyDescriptor(obj, keys[i]);
    }
    return descriptors;
  };

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  if (typeof process !== 'undefined' && process.noDeprecation === true) {
    return fn;
  }

  // Allow for deprecating things in the process of starting up.
  if (typeof process === 'undefined') {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnvRegex = /^$/;

if (process.env.NODE_DEBUG) {
  var debugEnv = process.env.NODE_DEBUG;
  debugEnv = debugEnv.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/,/g, '$|^')
    .toUpperCase();
  debugEnvRegex = new RegExp('^' + debugEnv + '$', 'i');
}
exports.debuglog = function(set) {
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (debugEnvRegex.test(set)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').slice(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.slice(1, -1);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
exports.types = require('./support/types');

function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;
exports.types.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;
exports.types.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;
exports.types.isNativeError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

var kCustomPromisifiedSymbol = typeof Symbol !== 'undefined' ? Symbol('util.promisify.custom') : undefined;

exports.promisify = function promisify(original) {
  if (typeof original !== 'function')
    throw new TypeError('The "original" argument must be of type Function');

  if (kCustomPromisifiedSymbol && original[kCustomPromisifiedSymbol]) {
    var fn = original[kCustomPromisifiedSymbol];
    if (typeof fn !== 'function') {
      throw new TypeError('The "util.promisify.custom" argument must be of type Function');
    }
    Object.defineProperty(fn, kCustomPromisifiedSymbol, {
      value: fn, enumerable: false, writable: false, configurable: true
    });
    return fn;
  }

  function fn() {
    var promiseResolve, promiseReject;
    var promise = new Promise(function (resolve, reject) {
      promiseResolve = resolve;
      promiseReject = reject;
    });

    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    args.push(function (err, value) {
      if (err) {
        promiseReject(err);
      } else {
        promiseResolve(value);
      }
    });

    try {
      original.apply(this, args);
    } catch (err) {
      promiseReject(err);
    }

    return promise;
  }

  Object.setPrototypeOf(fn, Object.getPrototypeOf(original));

  if (kCustomPromisifiedSymbol) Object.defineProperty(fn, kCustomPromisifiedSymbol, {
    value: fn, enumerable: false, writable: false, configurable: true
  });
  return Object.defineProperties(
    fn,
    getOwnPropertyDescriptors(original)
  );
}

exports.promisify.custom = kCustomPromisifiedSymbol

function callbackifyOnRejected(reason, cb) {
  // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
  // Because `null` is a special error value in callbacks which means "no error
  // occurred", we error-wrap so the callback consumer can distinguish between
  // "the promise rejected with null" or "the promise fulfilled with undefined".
  if (!reason) {
    var newReason = new Error('Promise was rejected with a falsy value');
    newReason.reason = reason;
    reason = newReason;
  }
  return cb(reason);
}

function callbackify(original) {
  if (typeof original !== 'function') {
    throw new TypeError('The "original" argument must be of type Function');
  }

  // We DO NOT return the promise as it gives the user a false sense that
  // the promise is actually somehow related to the callback's execution
  // and that the callback throwing will reject the promise.
  function callbackified() {
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }

    var maybeCb = args.pop();
    if (typeof maybeCb !== 'function') {
      throw new TypeError('The last argument must be of type Function');
    }
    var self = this;
    var cb = function() {
      return maybeCb.apply(self, arguments);
    };
    // In true node style we process the callback on `nextTick` with all the
    // implications (stack, `uncaughtException`, `async_hooks`)
    original.apply(this, args)
      .then(function(ret) { process.nextTick(cb.bind(null, null, ret)) },
            function(rej) { process.nextTick(callbackifyOnRejected.bind(null, rej, cb)) });
  }

  Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
  Object.defineProperties(callbackified,
                          getOwnPropertyDescriptors(original));
  return callbackified;
}
exports.callbackify = callbackify;

}).call(this)}).call(this,require('_process'))

},{"./support/isBuffer":25,"./support/types":26,"_process":24,"inherits":17}],28:[function(require,module,exports){
(function (global){(function (){
'use strict';

var forEach = require('for-each');
var availableTypedArrays = require('available-typed-arrays');
var callBind = require('call-bind');
var callBound = require('call-bind/callBound');
var gOPD = require('gopd');

var $toString = callBound('Object.prototype.toString');
var hasToStringTag = require('has-tostringtag/shams')();

var g = typeof globalThis === 'undefined' ? global : globalThis;
var typedArrays = availableTypedArrays();

var $slice = callBound('String.prototype.slice');
var getPrototypeOf = Object.getPrototypeOf; // require('getprototypeof');

var $indexOf = callBound('Array.prototype.indexOf', true) || function indexOf(array, value) {
	for (var i = 0; i < array.length; i += 1) {
		if (array[i] === value) {
			return i;
		}
	}
	return -1;
};
var cache = { __proto__: null };
if (hasToStringTag && gOPD && getPrototypeOf) {
	forEach(typedArrays, function (typedArray) {
		var arr = new g[typedArray]();
		if (Symbol.toStringTag in arr) {
			var proto = getPrototypeOf(arr);
			var descriptor = gOPD(proto, Symbol.toStringTag);
			if (!descriptor) {
				var superProto = getPrototypeOf(proto);
				descriptor = gOPD(superProto, Symbol.toStringTag);
			}
			cache['$' + typedArray] = callBind(descriptor.get);
		}
	});
} else {
	forEach(typedArrays, function (typedArray) {
		var arr = new g[typedArray]();
		cache['$' + typedArray] = callBind(arr.slice);
	});
}

var tryTypedArrays = function tryAllTypedArrays(value) {
	var found = false;
	forEach(cache, function (getter, typedArray) {
		if (!found) {
			try {
				if ('$' + getter(value) === typedArray) {
					found = $slice(typedArray, 1);
				}
			} catch (e) { /**/ }
		}
	});
	return found;
};

var trySlices = function tryAllSlices(value) {
	var found = false;
	forEach(cache, function (getter, name) {
		if (!found) {
			try {
				getter(value);
				found = $slice(name, 1);
			} catch (e) { /**/ }
		}
	});
	return found;
};

module.exports = function whichTypedArray(value) {
	if (!value || typeof value !== 'object') { return false; }
	if (!hasToStringTag) {
		var tag = $slice($toString(value), 8, -1);
		if ($indexOf(typedArrays, tag) > -1) {
			return tag;
		}
		if (tag !== 'Object') {
			return false;
		}
		// node < 0.6 hits here on real Typed Arrays
		return trySlices(value);
	}
	if (!gOPD) { return null; } // unknown engine
	return tryTypedArrays(value);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"available-typed-arrays":1,"call-bind":6,"call-bind/callBound":5,"for-each":7,"gopd":11,"has-tostringtag/shams":14}],29:[function(require,module,exports){


(function() {


/* Copyright (c) 2014 The Chromium Authors. All rights reserved.
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file. */

/**
 * @fileoverview Low-level DOM traversal utility functions to find the
 *     next (or previous) character, word, sentence, line, or paragraph,
 *     in a completely stateless manner without actually manipulating the
 *     selection.
 */

/**
 * A class to represent a cursor location in the document,
 * like the start position or end position of a selection range.
 *
 * Later this may be extended to support "virtual text" for an object,
 * like the ALT text for an image.
 *
 * Note: we cache the text of a particular node at the time we
 * traverse into it. Later we should add support for dynamically
 * reloading it.
 * @param {Node} node The DOM node.
 * @param {number} index The index of the character within the node.
 * @param {string} text The cached text contents of the node.
 * @constructor
 */
const Cursor = function(node, index, text) {
  this.node = node;
  this.index = index;
  this.text = text;
};

/**
 * @return {Cursor} A new cursor pointing to the same location.
 */
Cursor.prototype.clone = function() {
  return new Cursor(this.node, this.index, this.text);
};

/**
 * Modify this cursor to point to the location that another cursor points to.
 * @param {Cursor} otherCursor The cursor to copy from.
 */
Cursor.prototype.copyFrom = function(otherCursor) {
  this.node = otherCursor.node;
  this.index = otherCursor.index;
  this.text = otherCursor.text;
};

/**
 * Utility functions for stateless DOM traversal.
 * @constructor
 */
const TraverseUtil = function() {};

/**
 * Gets the text representation of a node. This allows us to substitute
 * alt text, names, or titles for html elements that provide them.
 * @param {Node} node A DOM node.
 * @return {string} A text string representation of the node.
 */
TraverseUtil.getNodeText = function(node) {
  if (node.constructor == Text) {
    return node.data;
  } else {
    return '';
  }
};

/**
 * Return true if a node should be treated as a leaf node, because
 * its children are properties of the object that shouldn't be traversed.
 *
 * TODO(dmazzoni): replace this with a predicate that detects nodes with
 * ARIA roles and other objects that have their own description.
 * For now we just detect a couple of common cases.
 *
 * @param {Node} node A DOM node.
 * @return {boolean} True if the node should be treated as a leaf node.
 */
TraverseUtil.treatAsLeafNode = function(node) {
  return node.childNodes.length == 0 ||
         node.nodeName == 'SELECT' ||
         node.nodeName == 'OBJECT';
};

/**
 * Return true only if a single character is whitespace.
 * From https://developer.mozilla.org/en/Whitespace_in_the_DOM,
 * whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020.
 *
 * @param {string} c A string containing a single character.
 * @return {boolean} True if the character is whitespace, otherwise false.
 */
TraverseUtil.isWhitespace = function(c) {
  return (c == ' ' || c == '\n' || c == '\r' || c == '\t');
};

/**
 * Set the selection to the range between the given start and end cursors.
 * @param {Cursor} start The desired start of the selection.
 * @param {Cursor} end The desired end of the selection.
 * @return {Selection} the selection object.
 */
TraverseUtil.setSelection = function(start, end) {
  var sel = window.getSelection();
  sel.removeAllRanges();
  var range = document.createRange();
  range.setStart(start.node, start.index);
  range.setEnd(end.node, end.index);
  sel.addRange(range);

  return sel;
};

/**
 * Use the computed CSS style to figure out if this DOM node is currently
 * visible.
 * @param {Node} node A HTML DOM node.
 * @return {boolean} Whether or not the html node is visible.
 */
TraverseUtil.isVisible = function(node) {
  if (!node.style)
    return true;
  var style = window.getComputedStyle(/** @type {Element} */(node), null);
  return (!!style && style.display != 'none' && style.visibility != 'hidden');
};

/**
 * Use the class name to figure out if this DOM node should be traversed.
 * @param {Node} node A HTML DOM node.
 * @return {boolean} Whether or not the html node should be traversed.
 */
TraverseUtil.isSkipped = function(node) {
  if (node.constructor == Text)
    node = node.parentElement;
  if (node.className == 'CaretBrowsing_Caret' ||
      node.className == 'CaretBrowsing_AnimateCaret') {
    return true;
  }
  return false;
};

/**
 * Moves the cursor forwards until it has crossed exactly one character.
 * @param {Cursor} cursor The cursor location where the search should start.
 *     On exit, the cursor will be immediately to the right of the
 *     character returned.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The character found, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.forwardsChar = function(cursor, nodesCrossed) {
  while (true) {
    // Move down until we get to a leaf node.
    var childNode = null;
    if (!TraverseUtil.treatAsLeafNode(cursor.node)) {
      for (var i = cursor.index; i < cursor.node.childNodes.length; i++) {
        var node = cursor.node.childNodes[i];
        if (TraverseUtil.isSkipped(node)) {
          nodesCrossed.push(node);
          continue;
        }
        if (TraverseUtil.isVisible(node)) {
          childNode = node;
          break;
        }
      }
    }
    if (childNode) {
      cursor.node = childNode;
      cursor.index = 0;
      cursor.text = TraverseUtil.getNodeText(cursor.node);
      if (cursor.node.constructor != Text) {
        nodesCrossed.push(cursor.node);
      }
      continue;
    }

    // Return the next character from this leaf node.
    if (cursor.index < cursor.text.length)
      return cursor.text[cursor.index++];

    // Move to the next sibling, going up the tree as necessary.
    while (cursor.node != null) {
      // Try to move to the next sibling.
      var siblingNode = null;
      for (var node = cursor.node.nextSibling;
           node != null;
           node = node.nextSibling) {
        if (TraverseUtil.isSkipped(node)) {
          nodesCrossed.push(node);
          continue;
        }
        if (TraverseUtil.isVisible(node)) {
          siblingNode = node;
          break;
        }
      }
      if (siblingNode) {
        cursor.node = siblingNode;
        cursor.text = TraverseUtil.getNodeText(siblingNode);
        cursor.index = 0;

        if (cursor.node.constructor != Text) {
          nodesCrossed.push(cursor.node);
        }

        break;
      }

      // Otherwise, move to the parent.
      if (cursor.node.parentNode &&
          cursor.node.parentNode.constructor != HTMLBodyElement) {
        cursor.node = cursor.node.parentNode;
        cursor.text = null;
        cursor.index = 0;
      } else {
        return null;
      }
    }
  }
};

/**
 * Moves the cursor backwards until it has crossed exactly one character.
 * @param {Cursor} cursor The cursor location where the search should start.
 *     On exit, the cursor will be immediately to the left of the
 *     character returned.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The previous character, or null if the top of the
 *     document has been reached.
 */
TraverseUtil.backwardsChar = function(cursor, nodesCrossed) {
  while (true) {
    // Move down until we get to a leaf node.
    var childNode = null;
    if (!TraverseUtil.treatAsLeafNode(cursor.node)) {
      for (var i = cursor.index - 1; i >= 0; i--) {
        var node = cursor.node.childNodes[i];
        if (TraverseUtil.isSkipped(node)) {
          nodesCrossed.push(node);
          continue;
        }
        if (TraverseUtil.isVisible(node)) {
          childNode = node;
          break;
        }
      }
    }
    if (childNode) {
      cursor.node = childNode;
      cursor.text = TraverseUtil.getNodeText(cursor.node);
      if (cursor.text.length)
        cursor.index = cursor.text.length;
      else
        cursor.index = cursor.node.childNodes.length;
      if (cursor.node.constructor != Text)
        nodesCrossed.push(cursor.node);
      continue;
    }

    // Return the previous character from this leaf node.
    if (cursor.text.length > 0 && cursor.index > 0) {
      return cursor.text[--cursor.index];
    }

    // Move to the previous sibling, going up the tree as necessary.
    while (true) {
      // Try to move to the previous sibling.
      var siblingNode = null;
      for (var node = cursor.node.previousSibling;
           node != null;
           node = node.previousSibling) {
        if (TraverseUtil.isSkipped(node)) {
          nodesCrossed.push(node);
          continue;
        }
        if (TraverseUtil.isVisible(node)) {
          siblingNode = node;
          break;
        }
      }
      if (siblingNode) {
        cursor.node = siblingNode;
        cursor.text = TraverseUtil.getNodeText(siblingNode);
        if (cursor.text.length)
          cursor.index = cursor.text.length;
        else
          cursor.index = cursor.node.childNodes.length;
        if (cursor.node.constructor != Text)
          nodesCrossed.push(cursor.node);
        break;
      }

      // Otherwise, move to the parent.
      if (cursor.node.parentNode &&
          cursor.node.parentNode.constructor != HTMLBodyElement) {
        cursor.node = cursor.node.parentNode;
        cursor.text = null;
        cursor.index = 0;
      } else {
        return null;
      }
    }
  }
};

/**
 * Finds the next character, starting from endCursor.  Upon exit, startCursor
 * and endCursor will surround the next character. If skipWhitespace is
 * true, will skip until a real character is found. Otherwise, it will
 * attempt to select all of the whitespace between the initial position
 * of endCursor and the next non-whitespace character.
 * @param {Cursor} startCursor On exit, points to the position before
 *     the char.
 * @param {Cursor} endCursor The position to start searching for the next
 *     char.  On exit, will point to the position past the char.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {boolean} skipWhitespace If true, will keep scanning until a
 *     non-whitespace character is found.
 * @return {?string} The next char, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextChar = function(
    startCursor, endCursor, nodesCrossed, skipWhitespace) {

  // Save the starting position and get the first character.
  startCursor.copyFrom(endCursor);
  var c = TraverseUtil.forwardsChar(endCursor, nodesCrossed);
  if (c == null)
    return null;

  // Keep track of whether the first character was whitespace.
  var initialWhitespace = TraverseUtil.isWhitespace(c);

  // Keep scanning until we find a non-whitespace or non-skipped character.
  while ((TraverseUtil.isWhitespace(c)) ||
      (TraverseUtil.isSkipped(endCursor.node))) {
    c = TraverseUtil.forwardsChar(endCursor, nodesCrossed);
    if (c == null)
      return null;
  }
  if (skipWhitespace || !initialWhitespace) {
    // If skipWhitepace is true, or if the first character we encountered
    // was not whitespace, return that non-whitespace character.
    startCursor.copyFrom(endCursor);
    startCursor.index--;
    return c;
  }
  else {
    for (var i = 0; i < nodesCrossed.length; i++) {
      if (TraverseUtil.isSkipped(nodesCrossed[i])) {
        // We need to make sure that startCursor and endCursor aren't
        // surrounding a skippable node.
        endCursor.index--;
        startCursor.copyFrom(endCursor);
        startCursor.index--;
        return ' ';
      }
    }
    // Otherwise, return all of the whitespace before that last character.
    endCursor.index--;
    return ' ';
  }
};

/**
 * Finds the previous character, starting from startCursor.  Upon exit,
 * startCursor and endCursor will surround the previous character.
 * If skipWhitespace is true, will skip until a real character is found.
 * Otherwise, it will attempt to select all of the whitespace between
 * the initial position of endCursor and the next non-whitespace character.
 * @param {Cursor} startCursor The position to start searching for the
 *     char. On exit, will point to the position before the char.
 * @param {Cursor} endCursor The position to start searching for the next
 *     char. On exit, will point to the position past the char.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {boolean} skipWhitespace If true, will keep scanning until a
 *     non-whitespace character is found.
 * @return {?string} The previous char, or null if the top of the
 *     document has been reached.
 */
TraverseUtil.getPreviousChar = function(
    startCursor, endCursor, nodesCrossed, skipWhitespace) {

  // Save the starting position and get the first character.
  endCursor.copyFrom(startCursor);
  var c = TraverseUtil.backwardsChar(startCursor, nodesCrossed);
  if (c == null)
    return null;

  // Keep track of whether the first character was whitespace.
  var initialWhitespace = TraverseUtil.isWhitespace(c);

  // Keep scanning until we find a non-whitespace or non-skipped character.
  while ((TraverseUtil.isWhitespace(c)) ||
      (TraverseUtil.isSkipped(startCursor.node))) {
    c = TraverseUtil.backwardsChar(startCursor, nodesCrossed);
    if (c == null)
      return null;
  }
  if (skipWhitespace || !initialWhitespace) {
    // If skipWhitepace is true, or if the first character we encountered
    // was not whitespace, return that non-whitespace character.
    endCursor.copyFrom(startCursor);
    endCursor.index++;
    return c;
  } else {
    for (var i = 0; i < nodesCrossed.length; i++) {
      if (TraverseUtil.isSkipped(nodesCrossed[i])) {
        startCursor.index++;
        endCursor.copyFrom(startCursor);
        endCursor.index++;
        return ' ';
      }
    }
    // Otherwise, return all of the whitespace before that last character.
    startCursor.index++;
    return ' ';
  }
};

/**
 * Finds the next word, starting from endCursor.  Upon exit, startCursor
 * and endCursor will surround the next word.  A word is defined to be
 * a string of 1 or more non-whitespace characters in the same DOM node.
 * @param {Cursor} startCursor On exit, will point to the beginning of the
 *     word returned.
 * @param {Cursor} endCursor The position to start searching for the next
 *     word.  On exit, will point to the end of the word returned.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The next word, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextWord = function(startCursor, endCursor,
    nodesCrossed) {

  // Find the first non-whitespace or non-skipped character.
  var cursor = endCursor.clone();
  var c = TraverseUtil.forwardsChar(cursor, nodesCrossed);
  if (c == null)
    return null;
  while ((TraverseUtil.isWhitespace(c)) ||
      (TraverseUtil.isSkipped(cursor.node))) {
    c = TraverseUtil.forwardsChar(cursor, nodesCrossed);
    if (c == null)
      return null;
  }

  // Set startCursor to the position immediately before the first
  // character in our word. It's safe to decrement |index| because
  // forwardsChar guarantees that the cursor will be immediately to the
  // right of the returned character on exit.
  startCursor.copyFrom(cursor);
  startCursor.index--;

  // Keep building up our word until we reach a whitespace character or
  // would cross a tag.  Don't actually return any tags crossed, because this
  // word goes up until the tag boundary but not past it.
  endCursor.copyFrom(cursor);
  var word = c;
  var newNodesCrossed = [];
  c = TraverseUtil.forwardsChar(cursor, newNodesCrossed);
  if (c == null) {
    return word;
  }
  while (!TraverseUtil.isWhitespace(c) &&
     newNodesCrossed.length == 0) {
    word += c;
    endCursor.copyFrom(cursor);
    c = TraverseUtil.forwardsChar(cursor, newNodesCrossed);
    if (c == null) {
      return word;
    }
  }
  return word;
};

/**
 * Finds the previous word, starting from startCursor.  Upon exit, startCursor
 * and endCursor will surround the previous word.  A word is defined to be
 * a string of 1 or more non-whitespace characters in the same DOM node.
 * @param {Cursor} startCursor The position to start searching for the
 *     previous word.  On exit, will point to the beginning of the
 *     word returned.
 * @param {Cursor} endCursor On exit, will point to the end of the
 *     word returned.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The previous word, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getPreviousWord = function(startCursor, endCursor,
    nodesCrossed) {
  // Find the first non-whitespace or non-skipped character.
  var cursor = startCursor.clone();
  var c = TraverseUtil.backwardsChar(cursor, nodesCrossed);
  if (c == null)
    return null;
  while ((TraverseUtil.isWhitespace(c) ||
      (TraverseUtil.isSkipped(cursor.node)))) {
    c = TraverseUtil.backwardsChar(cursor, nodesCrossed);
    if (c == null)
      return null;
  }

  // Set endCursor to the position immediately after the first
  // character we've found (the last character of the word, since we're
  // searching backwards).
  endCursor.copyFrom(cursor);
  endCursor.index++;

  // Keep building up our word until we reach a whitespace character or
  // would cross a tag.  Don't actually return any tags crossed, because this
  // word goes up until the tag boundary but not past it.
  startCursor.copyFrom(cursor);
  var word = c;
  var newNodesCrossed = [];
  c = TraverseUtil.backwardsChar(cursor, newNodesCrossed);
  if (c == null)
    return word;
  while (!TraverseUtil.isWhitespace(c) &&
      newNodesCrossed.length == 0) {
    word = c + word;
    startCursor.copyFrom(cursor);
    c = TraverseUtil.backwardsChar(cursor, newNodesCrossed);
    if (c == null)
      return word;
  }

  return word;
};

/**
 * Finds the next sentence, starting from endCursor.  Upon exit,
 * startCursor and endCursor will surround the next sentence.
 *
 * @param {Cursor} startCursor On exit, marks the beginning of the sentence.
 * @param {Cursor} endCursor The position to start searching for the next
 *     sentence.  On exit, will point to the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {Object} breakTags Associative array of tags that should break
 *     the sentence.
 * @return {?string} The next sentence, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextSentence = function(
    startCursor, endCursor, nodesCrossed, breakTags) {
  return TraverseUtil.getNextString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        if (str.substr(-1) == '.')
          return true;
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && (style.display != 'inline' ||
                        breakTags[nodes[i].tagName])) {
            return true;
          }
        }
        return false;
      });
};

/**
 * Finds the previous sentence, starting from startCursor.  Upon exit,
 * startCursor and endCursor will surround the previous sentence.
 *
 * @param {Cursor} startCursor The position to start searching for the next
 *     sentence.  On exit, will point to the start of the returned string.
 * @param {Cursor} endCursor On exit, the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {Object} breakTags Associative array of tags that should break
 *     the sentence.
 * @return {?string} The previous sentence, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getPreviousSentence = function(
    startCursor, endCursor, nodesCrossed, breakTags) {
  return TraverseUtil.getPreviousString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        if (word.substr(-1) == '.')
          return true;
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && (style.display != 'inline' ||
                        breakTags[nodes[i].tagName])) {
            return true;
          }
        }
        return false;
      });
};

/**
 * Finds the next line, starting from endCursor.  Upon exit,
 * startCursor and endCursor will surround the next line.
 *
 * @param {Cursor} startCursor On exit, marks the beginning of the line.
 * @param {Cursor} endCursor The position to start searching for the next
 *     line.  On exit, will point to the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {number} lineLength The maximum number of characters in a line.
 * @param {Object} breakTags Associative array of tags that should break
 *     the line.
 * @return {?string} The next line, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextLine = function(
    startCursor, endCursor, nodesCrossed, lineLength, breakTags) {
  return TraverseUtil.getNextString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        if (str.length + word.length + 1 > lineLength)
          return true;
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && (style.display != 'inline' ||
                        breakTags[nodes[i].tagName])) {
            return true;
          }
        }
        return false;
      });
};

/**
 * Finds the previous line, starting from startCursor.  Upon exit,
 * startCursor and endCursor will surround the previous line.
 *
 * @param {Cursor} startCursor The position to start searching for the next
 *     line.  On exit, will point to the start of the returned string.
 * @param {Cursor} endCursor On exit, the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {number} lineLength The maximum number of characters in a line.
 * @param {Object} breakTags Associative array of tags that should break
 *     the sentence.
 *  @return {?string} The previous line, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getPreviousLine = function(
    startCursor, endCursor, nodesCrossed, lineLength, breakTags) {
  return TraverseUtil.getPreviousString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        if (str.length + word.length + 1 > lineLength)
          return true;
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && (style.display != 'inline' ||
                        breakTags[nodes[i].tagName])) {
            return true;
          }
        }
        return false;
      });
};

/**
 * Finds the next paragraph, starting from endCursor.  Upon exit,
 * startCursor and endCursor will surround the next paragraph.
 *
 * @param {Cursor} startCursor On exit, marks the beginning of the paragraph.
 * @param {Cursor} endCursor The position to start searching for the next
 *     paragraph.  On exit, will point to the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The next paragraph, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextParagraph = function(startCursor, endCursor,
    nodesCrossed) {
  return TraverseUtil.getNextString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && style.display != 'inline') {
            return true;
          }
        }
        return false;
      });
};

/**
 * Finds the previous paragraph, starting from startCursor.  Upon exit,
 * startCursor and endCursor will surround the previous paragraph.
 *
 * @param {Cursor} startCursor The position to start searching for the next
 *     paragraph.  On exit, will point to the start of the returned string.
 * @param {Cursor} endCursor On exit, the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @return {?string} The previous paragraph, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getPreviousParagraph = function(
    startCursor, endCursor, nodesCrossed) {
  return TraverseUtil.getPreviousString(
      startCursor, endCursor, nodesCrossed,
      function(str, word, nodes) {
        for (var i = 0; i < nodes.length; i++) {
          if (TraverseUtil.isSkipped(nodes[i])) {
            return true;
          }
          var style = window.getComputedStyle(nodes[i], null);
          if (style && style.display != 'inline') {
            return true;
          }
        }
        return false;
      });
};

/**
 * Customizable function to return the next string of words in the DOM, based
 * on provided functions to decide when to break one string and start
 * the next. This can be used to get the next sentence, line, paragraph,
 * or potentially other granularities.
 *
 * Finds the next contiguous string, starting from endCursor.  Upon exit,
 * startCursor and endCursor will surround the next string.
 *
 * The breakBefore function takes three parameters, and
 * should return true if the string should be broken before the proposed
 * next word:
 *   str The string so far.
 *   word The next word to be added.
 *   nodesCrossed The nodes crossed in reaching this next word.
 *
 * @param {Cursor} startCursor On exit, will point to the beginning of the
 *     next string.
 * @param {Cursor} endCursor The position to start searching for the next
 *     string.  On exit, will point to the end of the returned string.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {function(string, string, Array<string>)} breakBefore
 *     Function that takes the string so far, next word to be added, and
 *     nodes crossed, and returns true if the string should be ended before
 *     adding this word.
 * @return {?string} The next string, or null if the bottom of the
 *     document has been reached.
 */
TraverseUtil.getNextString = function(
    startCursor, endCursor, nodesCrossed, breakBefore) {
  // Get the first word and set the start cursor to the start of the
  // first word.
  var wordStartCursor = endCursor.clone();
  var wordEndCursor = endCursor.clone();
  var newNodesCrossed = [];
  var str = '';
  var word = TraverseUtil.getNextWord(
      wordStartCursor, wordEndCursor, newNodesCrossed);
  if (word == null)
    return null;
  startCursor.copyFrom(wordStartCursor);

  // Always add the first word when the string is empty, and then keep
  // adding more words as long as breakBefore returns false
  while (!str || !breakBefore(str, word, newNodesCrossed)) {
    // Append this word, set the end cursor to the end of this word, and
    // update the returned list of nodes crossed to include ones we crossed
    // in reaching this word.
    if (str)
      str += ' ';
    str += word;
    nodesCrossed = nodesCrossed.concat(newNodesCrossed);
    endCursor.copyFrom(wordEndCursor);

    // Get the next word and go back to the top of the loop.
    newNodesCrossed = [];
    word = TraverseUtil.getNextWord(
        wordStartCursor, wordEndCursor, newNodesCrossed);
    if (word == null)
      return str;
  }

  return str;
};

/**
 * Customizable function to return the previous string of words in the DOM,
 * based on provided functions to decide when to break one string and start
 * the next. See getNextString, above, for more details.
 *
 * Finds the previous contiguous string, starting from startCursor.  Upon exit,
 * startCursor and endCursor will surround the next string.
 *
 * @param {Cursor} startCursor The position to start searching for the
 *     previous string.  On exit, will point to the beginning of the
 *     string returned.
 * @param {Cursor} endCursor On exit, will point to the end of the
 *     string returned.
 * @param {Array<Node>} nodesCrossed Any HTML nodes crossed between the
 *     initial and final cursor position will be pushed onto this array.
 * @param {function(string, string, Array<string>)} breakBefore
 *     Function that takes the string so far, the word to be added, and
 *     nodes crossed, and returns true if the string should be ended before
 *     adding this word.
 * @return {?string} The next string, or null if the top of the
 *     document has been reached.
 */
TraverseUtil.getPreviousString = function(
    startCursor, endCursor, nodesCrossed, breakBefore) {
  // Get the first word and set the end cursor to the end of the
  // first word.
  var wordStartCursor = startCursor.clone();
  var wordEndCursor = startCursor.clone();
  var newNodesCrossed = [];
  var str = '';
  var word = TraverseUtil.getPreviousWord(
      wordStartCursor, wordEndCursor, newNodesCrossed);
  if (word == null)
    return null;
  endCursor.copyFrom(wordEndCursor);

  // Always add the first word when the string is empty, and then keep
  // adding more words as long as breakBefore returns false
  while (!str || !breakBefore(str, word, newNodesCrossed)) {
    // Prepend this word, set the start cursor to the start of this word, and
    // update the returned list of nodes crossed to include ones we crossed
    // in reaching this word.
    if (str)
      str = ' ' + str;
    str = word + str;
    nodesCrossed = nodesCrossed.concat(newNodesCrossed);
    startCursor.copyFrom(wordStartCursor);
    // Get the previous word and go back to the top of the loop.
    newNodesCrossed = [];
    word = TraverseUtil.getPreviousWord(
        wordStartCursor, wordEndCursor, newNodesCrossed);
    if (word == null)
      return str;
  }

  return str;
};

module.exports.Cursor = Cursor;
module.exports.TraverseUtil = TraverseUtil;

}).call(this);

},{}],30:[function(require,module,exports){
(function() {
  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  'use strict';
  var debug, defaults, freeze, isa, log, ref, types, validate, validate_optional, µ,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  µ = require('./main');

  log = console.log;

  debug = console.debug;

  freeze = Object.freeze;

  ({types, isa, validate, validate_optional} = require('./types'));

  //-----------------------------------------------------------------------------------------------------------
  defaults = {
    //---------------------------------------------------------------------------------------------------------
    latch: {
      dt: 350 // time in milliseconds between first and last key event to trigger latching
    },
    
    //---------------------------------------------------------------------------------------------------------
    kblike_eventnames: [
      // ### TAINT not all of these events are needed
      'click',
      // 'dblclick', # implied / preceded by `click` event
      // 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart',
      // 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup',
      // 'pointercancel',
      'wheel',
      'pointermove',
      'pointerout',
      'pointerover'
    ],
    //---------------------------------------------------------------------------------------------------------
    // 'pointerdown',
    // 'pointerenter',
    // 'pointerleave',
    // 'pointerup',
    // ------------- Tier A: ubiquitous, unequivocal
    modifier_names: ['Alt', 'AltGraph', 'Control', 'Meta', 'Shift', 'CapsLock']
  };

  //-----------------------------------------------------------------------------------------------------------

  //===========================================================================================================
  // ------------- Tier B: status doubtful
  // 'Hyper',
  // 'OS',
  // 'Super',
  // 'Symbol',
  // ------------- Tier C: rare, not needed, or not sensed by JS
  // 'Fn',
  // 'FnLock',
  // 'NumLock',
  // 'ScrollLock',
  // 'SymbolLock',
  this._Kb = (function() {
    class _Kb {
      //---------------------------------------------------------------------------------------------------------
      constructor(cfg) {
        var i, len, modifier_name, ref;
        //---------------------------------------------------------------------------------------------------------
        /* Get the last known keyboard modifier state. NOTE may be extended with `event` argument ITF. */
        // µ.DOM.get_kb_modifier_state = () => return { ...prv, }

        //---------------------------------------------------------------------------------------------------------
        this.get_changed_kb_modifier_state = this.get_changed_kb_modifier_state.bind(this);
        //-----------------------------------------------------------------------------------------------------------
        // get_kb_modifier_state = ( event, value ) =>
        //   @_prv_modifiers = {}
        //   for ( modifier_name of @cfg.modifier_names ) {
        //     @_prv_modifiers[ modifier_name ] = null
        //   freeze( @_prv_modifiers )

        //---------------------------------------------------------------------------------------------------------
        this._set_capslock_state = this._set_capslock_state.bind(this);
        this.cfg = {...defaults, ...cfg};
        ref = this.cfg.modifier_names;
        for (i = 0, len = ref.length; i < len; i++) {
          modifier_name = ref[i];
          this._prv_modifiers[modifier_name] = null;
        }
        freeze(this._prv_modifiers);
        return null;
      }

      get_changed_kb_modifier_state() {
        var any_has_changed, changed_modifiers, crt_modifiers, i, len, modifier_name, ref, state, this_has_changed;
        /* Return keyboard modifier state if it has changed since the last call, or `null` if it hasn't changed. */
        // log( '^33988^', { event, } )
        crt_modifiers = {
          _type: event.type
        };
        changed_modifiers = {
          _type: event.type
        };
        any_has_changed = false;
        ref = this.cfg.modifier_names;
        for (i = 0, len = ref.length; i < len; i++) {
          modifier_name = ref[i];
          state = event.getModifierState(modifier_name);
          this_has_changed = this._prv_modifiers[modifier_name] !== state;
          any_has_changed = any_has_changed || this_has_changed;
          crt_modifiers[modifier_name] = state;
          if (this_has_changed) {
            changed_modifiers[modifier_name] = state;
          }
        }
        if (any_has_changed) {
          this._prv_modifiers = freeze(crt_modifiers);
          return changed_modifiers;
        }
        return null;
      }

      _set_capslock_state(capslock_active) {
        if (capslock_active === this._capslock_active) {
          return null;
        }
        this._capslock_active = capslock_active;
        µ.DOM.emit_custom_event('µ_kb_capslock_changed', {
          detail: {
            CapsLock: capslock_active
          }
        });
        return null;
      }

    };

    _Kb.prototype._prv_modifiers = {};

    _Kb.prototype._capslock_active = false;

    return _Kb;

  }).call(this);

  // #---------------------------------------------------------------------------------------------------------
  // on_push: ( keynames, handler ) =>
  // keynames  = [ keynames, ] unless isa.list keynames
  // types     = [ types,    ] unless isa.list types
  // validate.kb_keynames  keynames
  // validate.kb_types     types

  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  //#########################################################################################################
  ref = this.Kb = (function() {
    class Kb extends this._Kb {
      constructor() {
        super(...arguments);
        //---------------------------------------------------------------------------------------------------------
        this._handler_from_watcher = this._handler_from_watcher.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._listen_to_key = this._listen_to_key.bind(this);
        //=========================================================================================================
        // MBMCD
        //---------------------------------------------------------------------------------------------------------
        this._listen_to_modifiers = this._listen_to_modifiers.bind(this);
        //---------------------------------------------------------------------------------------------------------
        this._emit_mbmcd_key_events = this._emit_mbmcd_key_events.bind(this);
      }

      //---------------------------------------------------------------------------------------------------------
      _get_latching_keyname() {
        var R, ref1, ref10, ref11, ref12, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9;
        if (!((Date.now() - ((ref1 = (ref2 = this._shreg[0]) != null ? ref2.t : void 0) != null ? ref1 : 0)) < this.cfg.latch.dt)) {
          return null;
        }
        if (((ref3 = this._shreg[0]) != null ? ref3.dir : void 0) !== 'down') {
          return null;
        }
        if (((ref4 = this._shreg[1]) != null ? ref4.dir : void 0) !== 'up') {
          return null;
        }
        if (((ref5 = this._shreg[2]) != null ? ref5.dir : void 0) !== 'down') {
          return null;
        }
        if (((ref6 = this._shreg[3]) != null ? ref6.dir : void 0) !== 'up') {
          return null;
        }
        if (((((ref9 = this._shreg[0]) != null ? ref9.name : void 0) !== (ref8 = (ref10 = this._shreg[1]) != null ? ref10.name : void 0) || ref8 !== (ref7 = (ref11 = this._shreg[2]) != null ? ref11.name : void 0)) || ref7 !== ((ref12 = this._shreg[3]) != null ? ref12.name : void 0))) {
          return null;
        }
        R = this._shreg[3].name;
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      _initialize_latching() {
        var push;
        if (this._latching_initialized) {
          return null;
        }
        this._latching_initialized = true;
        push = (dir, event) => {
          var name;
          name = event.key;
          this._shreg.push({
            dir,
            name,
            t: Date.now()
          });
          while (this._shreg.length > 4) {
            this._shreg.shift();
          }
          return true;
        };
        µ.DOM.on(document, 'keydown', (event) => {
          return push('down', event);
        });
        µ.DOM.on(document, 'keyup', (event) => {
          return push('up', event);
        });
        return null;
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_push(keyname, handler) {
        var behavior, state;
        state = false;
        behavior = 'push';
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_toggle(keyname, handler) {
        var behavior, skip_next, state;
        state = false;
        behavior = 'toggle';
        skip_next = false;
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (state) {
            return true;
          }
          state = true;
          skip_next = true;
          // debug '^_listen_to_key@223^', 'keydown', { keyname, behavior, entry, }
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!state) {
            return true;
          }
          if (skip_next) {
            skip_next = false;
          } else {
            state = false;
          }
          // debug '^_listen_to_key@223^', 'toggle/keyup', { keyname, behavior, entry, }
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_latch(keyname, handler) {
        var behavior, state;
        this._initialize_latching();
        state = false;
        behavior = 'latch';
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (keyname === this._get_latching_keyname()) {
            state = !state;
            handler(freeze({keyname, behavior, state, event}));
          }
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_tlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'tlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = !is_latched;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          state = is_latched;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_ptlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'ptlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (is_latched) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (is_latched) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _listen_to_key_ntlatch(keyname, handler) {
        var behavior, is_latched, state;
        state = false;
        behavior = 'ntlatch';
        is_latched = false;
        //.......................................................................................................
        this._listen_to_key(keyname, 'latch', (d) => {
          return is_latched = d.state;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!is_latched) {
            return true;
          }
          state = false;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key !== keyname) {
            return true;
          }
          if (!is_latched) {
            return true;
          }
          state = true;
          handler(freeze({keyname, behavior, state, event}));
          return true;
        });
        //.......................................................................................................
        return null;
      }

      _handler_from_watcher(watcher) {
        boundMethodCheck(this, ref);
        /* TAINT could use single function for all handlers that emit the same event */
        validate.kb_watcher(watcher);
        if (isa.function(watcher)) {
          return watcher;
        }
        return function(d) {
          return µ.DOM.emit_custom_event(watcher, {
            detail: d
          });
        };
      }

      _listen_to_key(keyname, behavior, watcher) {
        var handler;
        boundMethodCheck(this, ref);
        if (keyname === 'Space') {
          keyname = ' ';
        }
        validate.kb_keyname(keyname);
        validate.kb_keytype(behavior);
        handler = this._handler_from_watcher(watcher);
        //.......................................................................................................
        switch (behavior) {
          case 'push':
            this._listen_to_key_push(keyname, handler);
            break;
          case 'toggle':
            this._listen_to_key_toggle(keyname, handler);
            break;
          case 'latch':
            this._listen_to_key_latch(keyname, handler);
            break;
          case 'tlatch':
            this._listen_to_key_tlatch(keyname, handler);
            break;
          case 'ntlatch':
            this._listen_to_key_ntlatch(keyname, handler);
            break;
          case 'ptlatch':
            this._listen_to_key_ptlatch(keyname, handler);
        }
        //.......................................................................................................
        return null/* NOTE may return a `remove_listener` method ITF */;
      }

      _listen_to_modifiers(watcher = null) {
        var eventname, handle_kblike_event, handler, i, len, ref1;
        boundMethodCheck(this, ref);
        if (watcher != null) {
          handler = this._handler_from_watcher(watcher);
        } else {
          handler = this._emit_mbmcd_key_events;
        }
        //.......................................................................................................
        handle_kblike_event = (event) => {
          var modifier_state;
          modifier_state = this.get_changed_kb_modifier_state(event);
          if (modifier_state !== null) {
            handler(modifier_state);
          }
          this._set_capslock_state(event.getModifierState('CapsLock'));
          return null;
        };
        ref1 = this.cfg.kblike_eventnames;
        //.......................................................................................................
        for (i = 0, len = ref1.length; i < len; i++) {
          eventname = ref1[i];
          µ.DOM.on(document, eventname, handle_kblike_event);
        }
        //.......................................................................................................
        µ.DOM.on(document, 'keydown', (event) => {
          // handle_kblike_event event ### !!!!!!!!!!!!!!!!!!!!!! ###
          /* TAINT logic is questionable */
          if (event.key === 'CapsLock') {
            this._set_capslock_state(!this._capslock_active);
          } else {
            this._set_capslock_state(event.getModifierState('CapsLock'));
          }
          return null;
        });
        //.......................................................................................................
        µ.DOM.on(document, 'keyup', (event) => {
          if (event.key === 'CapsLock') {
            // handle_kblike_event event ### !!!!!!!!!!!!!!!!!!!!!! ###
            /* TAINT logic is questionable */
            return null;
          }
          this._set_capslock_state(event.getModifierState('CapsLock'));
          return null;
        });
        return null;
      }

      _emit_mbmcd_key_events(d) {
        var eventname, key, state;
        boundMethodCheck(this, ref);
/* Accepts an object with modifier names as keys, booleans as values; will emit `keydown`, `keyup`
   events as needed. */
/* TAINT only iterate over modifier names? */
        for (key in d) {
          state = d[key];
          if (key === '_type') {
            continue;
          }
          eventname = state ? 'keydown' : 'keyup';
          document.dispatchEvent(new KeyboardEvent(eventname, {key}));
        }
        return null;
      }

    };

    // #---------------------------------------------------------------------------------------------------------
    // _defaults: freeze {
    //   state: freeze { down: false, up: false, toggle: false, latch: false, tlatch: false, }
    //   }

    //---------------------------------------------------------------------------------------------------------
    Kb.prototype._shreg = [];

    Kb.prototype._latching_initialized = false;

    return Kb;

  }).call(this);

}).call(this);


},{"./main":"mudom","./types":32}],31:[function(require,module,exports){
(function() {
  'use strict';
  var TU;

  TU = require('../deps/traverse_util.js');

  //===========================================================================================================
  this.Linefinder = class Linefinder {
    //---------------------------------------------------------------------------------------------------------
    constructor(cfg) {
      /* TAINT use intertype */
      var defaults;
      defaults = {
        box_element_name: 'div',
        box_class_name: 'box',
        xxx_height_factor: 1 / 2
      };
      this./* relative minimum height to recognize line step */cfg = Object.freeze({...defaults, ...cfg});
      return void 0;
    }

    //---------------------------------------------------------------------------------------------------------
    _draw_box(rectangle, cfg) {
      var box;
      cfg = {...this.cfg, ...cfg};
      box = document.createElement(cfg.element_name);
      box.style.top = document.documentElement.scrollTop + rectangle.top + 'px';
      box.style.left = document.documentElement.scrollLeft + rectangle.left + 'px';
      box.style.width = rectangle.width - 1 + 'px'; // collapse borders
      box.style.height = rectangle.height + 'px';
      box.classList.add(cfg.class_name);
      document.body.appendChild(box);
      return box;
    }

    //---------------------------------------------------------------------------------------------------------
    draw_box(rectangle) {
      var box;
      box = document.createElement(this.cfg.box_element_name);
      box.style.top = document.documentElement.scrollTop + rectangle.top + 'px';
      box.style.left = document.documentElement.scrollLeft + rectangle.left + 'px';
      box.style.width = rectangle.width - 1 + 'px'; // collapse borders
      box.style.height = rectangle.height + 'px';
      box.classList.add(this.cfg.box_class_name);
      document.body.appendChild(box);
      return box;
    }

    //---------------------------------------------------------------------------------------------------------
    _get_next_chr_rectangles(node, c1, c2) {
      var range, selection;
      TU.TraverseUtil.getNextChar(c1, c2, [], false);
      selection = TU.TraverseUtil.setSelection(c1, c2);
      range = selection.getRangeAt(0);
      if (!node.contains(range.startContainer.parentNode)) {
        return null;
      }
      if (!node.contains(range.endContainer.parentNode)) {
        return null;
      }
      return range.getClientRects();
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_chr_rectangles_of_node(node) {
      var c1, c2, rectangles, text_node;
      text_node = node.childNodes[0];
      c1 = new TU.Cursor(text_node, 0, text_node.data);
      c2 = new TU.Cursor(text_node, 0, text_node.data);
      TU.TraverseUtil.setSelection(c1, c2);
      while (true) {
        rectangles = this._get_next_chr_rectangles(node, c1, c2);
        if (rectangles == null) {
          break;
        }
        yield* rectangles;
      }
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    _reset_line_walker(s) {
      s.min_top = +2e308;
      s.max_bottom = -2e308;
      s.min_left = +2e308;
      s.max_right = -2e308;
      s.avg_height = 0;
      s.avg_bottom = 0;
      s.count = 0;
      return null;
    }

    //---------------------------------------------------------------------------------------------------------
    * walk_line_rectangles_of_node(node) {
      var rectangle, ref, s;
      this._reset_line_walker(s = {});
      ref = this.walk_chr_rectangles_of_node(node);
      for (rectangle of ref) {
        if (s.count > 0 && rectangle.bottom - s.avg_bottom > s.avg_height * this.cfg.xxx_height_factor) {
          yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
          this._reset_line_walker(s);
        }
        //.......................................................................................................
        // draw_box rectangle
        s.count++;
        s.min_top = Math.min(s.min_top, rectangle.top);
        s.max_bottom = Math.max(s.max_bottom, rectangle.bottom);
        s.min_left = Math.min(s.min_left, rectangle.left);
        s.max_right = Math.max(s.max_right, rectangle.right);
        s.avg_height = (s.avg_height * (s.count - 1) / s.count) + (rectangle.height * 1 / s.count);
        s.avg_bottom = (s.avg_bottom * (s.count - 1) / s.count) + (rectangle.bottom * 1 / s.count);
      }
      //.........................................................................................................
      if (s.count > 0) {
        yield new DOMRect(s.min_left, s.min_top, s.max_right - s.min_left, s.max_bottom - s.min_top); // left // top // width // height
      }
      return null;
    }

  };

}).call(this);


},{"../deps/traverse_util.js":29}],32:[function(require,module,exports){
(function() {
  'use strict';
  this.types = new (require('intertype')).Intertype();

  Object.assign(this, this.types.export());

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'kb_keytypes', tests:
  //   "x is a list of kb_keytype":     ( x ) -> @isa.list_of 'kb_keytype', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_keytype', {
    tests: {
      "x is one of 'toggle', 'latch', 'tlatch', 'ptlatch', 'ntlatch', 'push'": function(x) {
        return x === 'toggle' || x === 'latch' || x === 'tlatch' || x === 'ptlatch' || x === 'ntlatch' || x === 'push';
      }
    }
  });

  // #-----------------------------------------------------------------------------------------------------------
  // @declare 'kb_keynames', tests:
  //   "x is a list of kb_keyname":  ( x ) -> @isa.list_of 'kb_keyname', x
  //   "x is not empty":                   ( x ) -> not @isa.empty x

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_keyname', {
    tests: {
      "x is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('kb_watcher', {
    tests: {
      "x is a function or a nonempty_text": function(x) {
        return (this.isa.function(x)) || (this.isa.nonempty_text(x));
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT probably not correct to only check for Element, at least in some cases could be Node as well */
  this.declare('delement', function(x) {
    return (x === document) || (x instanceof Element);
  });

  this.declare('element', function(x) {
    return x instanceof Element;
  });

}).call(this);


},{"intertype":41}],33:[function(require,module,exports){
(function (process,global,Buffer){(function (){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = global || self, factory(global.loupe = {}));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var typeDetect = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
		 module.exports = factory() ;
	}(commonjsGlobal, (function () {
	/* !
	 * type-detect
	 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var promiseExists = typeof Promise === 'function';

	/* eslint-disable no-undef */
	var globalObject = typeof self === 'object' ? self : commonjsGlobal; // eslint-disable-line id-blacklist

	var symbolExists = typeof Symbol !== 'undefined';
	var mapExists = typeof Map !== 'undefined';
	var setExists = typeof Set !== 'undefined';
	var weakMapExists = typeof WeakMap !== 'undefined';
	var weakSetExists = typeof WeakSet !== 'undefined';
	var dataViewExists = typeof DataView !== 'undefined';
	var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
	var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
	var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
	var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
	var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
	var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
	var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
	var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
	var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
	var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
	var toStringLeftSliceLength = 8;
	var toStringRightSliceLength = -1;
	/**
	 * ### typeOf (obj)
	 *
	 * Uses `Object.prototype.toString` to determine the type of an object,
	 * normalising behaviour across engine versions & well optimised.
	 *
	 * @param {Mixed} object
	 * @return {String} object type
	 * @api public
	 */
	function typeDetect(obj) {
	  /* ! Speed optimisation
	   * Pre:
	   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
	   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
	   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
	   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
	   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
	   * Post:
	   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
	   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
	   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
	   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
	   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
	   */
	  var typeofObj = typeof obj;
	  if (typeofObj !== 'object') {
	    return typeofObj;
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
	   * Post:
	   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
	   */
	  if (obj === null) {
	    return 'null';
	  }

	  /* ! Spec Conformance
	   * Test: `Object.prototype.toString.call(window)``
	   *  - Node === "[object global]"
	   *  - Chrome === "[object global]"
	   *  - Firefox === "[object Window]"
	   *  - PhantomJS === "[object Window]"
	   *  - Safari === "[object Window]"
	   *  - IE 11 === "[object Window]"
	   *  - IE Edge === "[object Window]"
	   * Test: `Object.prototype.toString.call(this)``
	   *  - Chrome Worker === "[object global]"
	   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - IE 11 Worker === "[object WorkerGlobalScope]"
	   *  - IE Edge Worker === "[object WorkerGlobalScope]"
	   */
	  if (obj === globalObject) {
	    return 'global';
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
	   * Post:
	   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
	   */
	  if (
	    Array.isArray(obj) &&
	    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
	  ) {
	    return 'Array';
	  }

	  // Not caching existence of `window` and related properties due to potential
	  // for `window` to be unset before tests in quasi-browser environments.
	  if (typeof window === 'object' && window !== null) {
	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
	     * WhatWG HTML$7.7.3 - The `Location` interface
	     * Test: `Object.prototype.toString.call(window.location)``
	     *  - IE <=11 === "[object Object]"
	     *  - IE Edge <=13 === "[object Object]"
	     */
	    if (typeof window.location === 'object' && obj === window.location) {
	      return 'Location';
	    }

	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/#document)
	     * WhatWG HTML$3.1.1 - The `Document` object
	     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
	     *       which suggests that browsers should use HTMLTableCellElement for
	     *       both TD and TH elements. WhatWG separates these.
	     *       WhatWG HTML states:
	     *         > For historical reasons, Window objects must also have a
	     *         > writable, configurable, non-enumerable property named
	     *         > HTMLDocument whose value is the Document interface object.
	     * Test: `Object.prototype.toString.call(document)``
	     *  - Chrome === "[object HTMLDocument]"
	     *  - Firefox === "[object HTMLDocument]"
	     *  - Safari === "[object HTMLDocument]"
	     *  - IE <=10 === "[object Document]"
	     *  - IE 11 === "[object HTMLDocument]"
	     *  - IE Edge <=13 === "[object HTMLDocument]"
	     */
	    if (typeof window.document === 'object' && obj === window.document) {
	      return 'Document';
	    }

	    if (typeof window.navigator === 'object') {
	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
	       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
	       *  - IE <=10 === "[object MSMimeTypesCollection]"
	       */
	      if (typeof window.navigator.mimeTypes === 'object' &&
	          obj === window.navigator.mimeTypes) {
	        return 'MimeTypeArray';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
	       * Test: `Object.prototype.toString.call(navigator.plugins)``
	       *  - IE <=10 === "[object MSPluginsCollection]"
	       */
	      if (typeof window.navigator.plugins === 'object' &&
	          obj === window.navigator.plugins) {
	        return 'PluginArray';
	      }
	    }

	    if ((typeof window.HTMLElement === 'function' ||
	        typeof window.HTMLElement === 'object') &&
	        obj instanceof window.HTMLElement) {
	      /* ! Spec Conformance
	      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
	      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
	      *  - IE <=10 === "[object HTMLBlockElement]"
	      */
	      if (obj.tagName === 'BLOCKQUOTE') {
	        return 'HTMLQuoteElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('td'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TD') {
	        return 'HTMLTableDataCellElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('th'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TH') {
	        return 'HTMLTableHeaderCellElement';
	      }
	    }
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
	  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
	  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
	  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
	  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
	  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
	  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
	  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
	  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
	  * Post:
	  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
	  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
	  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
	  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
	  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
	  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
	  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
	  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
	  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
	  */
	  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
	  if (typeof stringTag === 'string') {
	    return stringTag;
	  }

	  var objPrototype = Object.getPrototypeOf(obj);
	  /* ! Speed optimisation
	  * Pre:
	  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
	  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
	  * Post:
	  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
	  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
	  */
	  if (objPrototype === RegExp.prototype) {
	    return 'RegExp';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
	  * Post:
	  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
	  */
	  if (objPrototype === Date.prototype) {
	    return 'Date';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
	   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
	   * Test: `Object.prototype.toString.call(Promise.resolve())``
	   *  - Chrome <=47 === "[object Object]"
	   *  - Edge <=20 === "[object Object]"
	   *  - Firefox 29-Latest === "[object Promise]"
	   *  - Safari 7.1-Latest === "[object Promise]"
	   */
	  if (promiseExists && objPrototype === Promise.prototype) {
	    return 'Promise';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
	  * Post:
	  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
	  */
	  if (setExists && objPrototype === Set.prototype) {
	    return 'Set';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
	  * Post:
	  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
	  */
	  if (mapExists && objPrototype === Map.prototype) {
	    return 'Map';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
	  * Post:
	  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
	  */
	  if (weakSetExists && objPrototype === WeakSet.prototype) {
	    return 'WeakSet';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
	  * Post:
	  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
	  */
	  if (weakMapExists && objPrototype === WeakMap.prototype) {
	    return 'WeakMap';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
	   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
	   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (dataViewExists && objPrototype === DataView.prototype) {
	    return 'DataView';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
	   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
	   * Test: `Object.prototype.toString.call(new Map().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (mapExists && objPrototype === mapIteratorPrototype) {
	    return 'Map Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
	   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
	   * Test: `Object.prototype.toString.call(new Set().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (setExists && objPrototype === setIteratorPrototype) {
	    return 'Set Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
	   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
	   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
	    return 'Array Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
	   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
	   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
	    return 'String Iterator';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
	  * Post:
	  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
	  */
	  if (objPrototype === null) {
	    return 'Object';
	  }

	  return Object
	    .prototype
	    .toString
	    .call(obj)
	    .slice(toStringLeftSliceLength, toStringRightSliceLength);
	}

	return typeDetect;

	})));
	});

	function _slicedToArray(arr, i) {
	  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}

	function _arrayWithHoles(arr) {
	  if (Array.isArray(arr)) return arr;
	}

	function _iterableToArrayLimit(arr, i) {
	  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _unsupportedIterableToArray(o, minLen) {
	  if (!o) return;
	  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
	  var n = Object.prototype.toString.call(o).slice(8, -1);
	  if (n === "Object" && o.constructor) n = o.constructor.name;
	  if (n === "Map" || n === "Set") return Array.from(n);
	  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}

	function _arrayLikeToArray(arr, len) {
	  if (len == null || len > arr.length) len = arr.length;

	  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

	  return arr2;
	}

	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}

	var ansiColors = {
	  bold: ['1', '22'],
	  dim: ['2', '22'],
	  italic: ['3', '23'],
	  underline: ['4', '24'],
	  // 5 & 6 are blinking
	  inverse: ['7', '27'],
	  hidden: ['8', '28'],
	  strike: ['9', '29'],
	  // 10-20 are fonts
	  // 21-29 are resets for 1-9
	  black: ['30', '39'],
	  red: ['31', '39'],
	  green: ['32', '39'],
	  yellow: ['33', '39'],
	  blue: ['34', '39'],
	  magenta: ['35', '39'],
	  cyan: ['36', '39'],
	  white: ['37', '39'],
	  brightblack: ['30;1', '39'],
	  brightred: ['31;1', '39'],
	  brightgreen: ['32;1', '39'],
	  brightyellow: ['33;1', '39'],
	  brightblue: ['34;1', '39'],
	  brightmagenta: ['35;1', '39'],
	  brightcyan: ['36;1', '39'],
	  brightwhite: ['37;1', '39'],
	  grey: ['90', '39']
	};
	var styles = {
	  special: 'cyan',
	  number: 'yellow',
	  boolean: 'yellow',
	  undefined: 'grey',
	  null: 'bold',
	  string: 'green',
	  symbol: 'green',
	  date: 'magenta',
	  regexp: 'red'
	};
	var truncator = '…';

	function colorise(value, styleType) {
	  var color = ansiColors[styles[styleType]] || ansiColors[styleType];

	  if (!color) {
	    return String(value);
	  }

	  return "\x1B[".concat(color[0], "m").concat(String(value), "\x1B[").concat(color[1], "m");
	}

	function normaliseOptions() {
	  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	      _ref$showHidden = _ref.showHidden,
	      showHidden = _ref$showHidden === void 0 ? false : _ref$showHidden,
	      _ref$depth = _ref.depth,
	      depth = _ref$depth === void 0 ? 2 : _ref$depth,
	      _ref$colors = _ref.colors,
	      colors = _ref$colors === void 0 ? false : _ref$colors,
	      _ref$customInspect = _ref.customInspect,
	      customInspect = _ref$customInspect === void 0 ? true : _ref$customInspect,
	      _ref$showProxy = _ref.showProxy,
	      showProxy = _ref$showProxy === void 0 ? false : _ref$showProxy,
	      _ref$maxArrayLength = _ref.maxArrayLength,
	      maxArrayLength = _ref$maxArrayLength === void 0 ? Infinity : _ref$maxArrayLength,
	      _ref$breakLength = _ref.breakLength,
	      breakLength = _ref$breakLength === void 0 ? Infinity : _ref$breakLength,
	      _ref$seen = _ref.seen,
	      seen = _ref$seen === void 0 ? [] : _ref$seen,
	      _ref$truncate = _ref.truncate,
	      truncate = _ref$truncate === void 0 ? Infinity : _ref$truncate,
	      _ref$stylize = _ref.stylize,
	      stylize = _ref$stylize === void 0 ? String : _ref$stylize;

	  var options = {
	    showHidden: Boolean(showHidden),
	    depth: Number(depth),
	    colors: Boolean(colors),
	    customInspect: Boolean(customInspect),
	    showProxy: Boolean(showProxy),
	    maxArrayLength: Number(maxArrayLength),
	    breakLength: Number(breakLength),
	    truncate: Number(truncate),
	    seen: seen,
	    stylize: stylize
	  };

	  if (options.colors) {
	    options.stylize = colorise;
	  }

	  return options;
	}
	function truncate(string, length) {
	  var tail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : truncator;
	  string = String(string);
	  var tailLength = tail.length;
	  var stringLength = string.length;

	  if (tailLength > length && stringLength > tailLength) {
	    return tail;
	  }

	  if (stringLength > length && stringLength > tailLength) {
	    return "".concat(string.slice(0, length - tailLength)).concat(tail);
	  }

	  return string;
	} // eslint-disable-next-line complexity

	function inspectList(list, options, inspectItem) {
	  var separator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ', ';
	  inspectItem = inspectItem || options.inspect;
	  var size = list.length;
	  if (size === 0) return '';
	  var originalLength = options.truncate;
	  var output = '';
	  var peek = '';
	  var truncated = '';

	  for (var i = 0; i < size; i += 1) {
	    var last = i + 1 === list.length;
	    var secondToLast = i + 2 === list.length;
	    truncated = "".concat(truncator, "(").concat(list.length - i, ")");
	    var value = list[i]; // If there is more than one remaining we need to account for a separator of `, `

	    options.truncate = originalLength - output.length - (last ? 0 : separator.length);
	    var string = peek || inspectItem(value, options) + (last ? '' : separator);
	    var nextLength = output.length + string.length;
	    var truncatedLength = nextLength + truncated.length; // If this is the last element, and adding it would
	    // take us over length, but adding the truncator wouldn't - then break now

	    if (last && nextLength > originalLength && output.length + truncated.length <= originalLength) {
	      break;
	    } // If this isn't the last or second to last element to scan,
	    // but the string is already over length then break here


	    if (!last && !secondToLast && truncatedLength > originalLength) {
	      break;
	    } // Peek at the next string to determine if we should
	    // break early before adding this item to the output


	    peek = last ? '' : inspectItem(list[i + 1], options) + (secondToLast ? '' : separator); // If we have one element left, but this element and
	    // the next takes over length, the break early

	    if (!last && secondToLast && truncatedLength > originalLength && nextLength + peek.length > originalLength) {
	      break;
	    }

	    output += string; // If the next element takes us to length -
	    // but there are more after that, then we should truncate now

	    if (!last && !secondToLast && nextLength + peek.length >= originalLength) {
	      truncated = "".concat(truncator, "(").concat(list.length - i - 1, ")");
	      break;
	    }

	    truncated = '';
	  }

	  return "".concat(output).concat(truncated);
	}
	function inspectProperty(_ref2, options) {
	  var _ref3 = _slicedToArray(_ref2, 2),
	      key = _ref3[0],
	      value = _ref3[1];

	  options.truncate -= 2;

	  if (typeof key !== 'string' && typeof key !== 'number') {
	    key = "[".concat(options.inspect(key, options), "]");
	  }

	  options.truncate -= key.length;
	  value = options.inspect(value, options);
	  return "".concat(key, ": ").concat(value);
	}

	function inspectArray(array, options) {
	  // Object.keys will always output the Array indices first, so we can slice by
	  // `array.length` to get non-index properties
	  var nonIndexProperties = Object.keys(array).slice(array.length);
	  if (!array.length && !nonIndexProperties.length) return '[]';
	  options.truncate -= 4;
	  var listContents = inspectList(array, options);
	  options.truncate -= listContents.length;
	  var propertyContents = '';

	  if (nonIndexProperties.length) {
	    propertyContents = inspectList(nonIndexProperties.map(function (key) {
	      return [key, array[key]];
	    }), options, inspectProperty);
	  }

	  return "[ ".concat(listContents).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
	}

	/* !
	 * Chai - getFuncName utility
	 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .getFuncName(constructorFn)
	 *
	 * Returns the name of a function.
	 * When a non-function instance is passed, returns `null`.
	 * This also includes a polyfill function if `aFunc.name` is not defined.
	 *
	 * @name getFuncName
	 * @param {Function} funct
	 * @namespace Utils
	 * @api public
	 */

	var toString = Function.prototype.toString;
	var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
	function getFuncName(aFunc) {
	  if (typeof aFunc !== 'function') {
	    return null;
	  }

	  var name = '';
	  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
	    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
	    var match = toString.call(aFunc).match(functionNameMatch);
	    if (match) {
	      name = match[1];
	    }
	  } else {
	    // If we've got a `name` property we just use it
	    name = aFunc.name;
	  }

	  return name;
	}

	var getFuncName_1 = getFuncName;

	var toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag ? Symbol.toStringTag : false;

	var getArrayName = function getArrayName(array) {
	  // We need to special case Node.js' Buffers, which report to be Uint8Array
	  if (typeof Buffer === 'function' && array instanceof Buffer) {
	    return 'Buffer';
	  }

	  if (toStringTag && toStringTag in array) {
	    return array[toStringTag];
	  }

	  return getFuncName_1(array.constructor);
	};

	function inspectTypedArray(array, options) {
	  var name = getArrayName(array);
	  options.truncate -= name.length + 4; // Object.keys will always output the Array indices first, so we can slice by
	  // `array.length` to get non-index properties

	  var nonIndexProperties = Object.keys(array).slice(array.length);
	  if (!array.length && !nonIndexProperties.length) return "".concat(name, "[]"); // As we know TypedArrays only contain Unsigned Integers, we can skip inspecting each one and simply
	  // stylise the toString() value of them

	  var output = '';

	  for (var i = 0; i < array.length; i++) {
	    var string = "".concat(options.stylize(truncate(array[i], options.truncate), 'number')).concat(array[i] === array.length ? '' : ', ');
	    options.truncate -= string.length;

	    if (array[i] !== array.length && options.truncate <= 3) {
	      output += "".concat(truncator, "(").concat(array.length - array[i] + 1, ")");
	      break;
	    }

	    output += string;
	  }

	  var propertyContents = '';

	  if (nonIndexProperties.length) {
	    propertyContents = inspectList(nonIndexProperties.map(function (key) {
	      return [key, array[key]];
	    }), options, inspectProperty);
	  }

	  return "".concat(name, "[ ").concat(output).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
	}

	function inspectDate(dateObject, options) {
	  // If we need to - truncate the time portion, but never the date
	  var split = dateObject.toJSON().split('T');
	  var date = split[0];
	  return options.stylize("".concat(date, "T").concat(truncate(split[1], options.truncate - date.length - 1)), 'date');
	}

	var toString$1 = Object.prototype.toString;

	var getFunctionName = function(fn) {
	  if (toString$1.call(fn) !== '[object Function]') return null
	  if (fn.name) return fn.name
	  var name = /^\s*function\s*([^\(]*)/im.exec(fn.toString())[1];
	  return name || 'anonymous'
	};

	function inspectFunction(func, options) {
	  var name = getFunctionName(func);

	  if (name === 'anonymous') {
	    return options.stylize('[Function]', 'special');
	  }

	  return options.stylize("[Function ".concat(truncate(name, options.truncate - 11), "]"), 'special');
	}

	function inspectMapEntry(_ref, options) {
	  var _ref2 = _slicedToArray(_ref, 2),
	      key = _ref2[0],
	      value = _ref2[1];

	  options.truncate -= 4;
	  key = options.inspect(key, options);
	  options.truncate -= key.length;
	  value = options.inspect(value, options);
	  return "".concat(key, " => ").concat(value);
	} // IE11 doesn't support `map.entries()`


	function mapToEntries(map) {
	  var entries = [];
	  map.forEach(function (value, key) {
	    entries.push([key, value]);
	  });
	  return entries;
	}

	function inspectMap(map, options) {
	  var size = map.size - 1;

	  if (size <= 0) {
	    return 'Map{}';
	  }

	  options.truncate -= 7;
	  return "Map{ ".concat(inspectList(mapToEntries(map), options, inspectMapEntry), " }");
	}

	var isNaN = Number.isNaN || function (i) {
	  return i !== i;
	}; // eslint-disable-line no-self-compare


	function inspectNumber(number, options) {
	  if (isNaN(number)) {
	    return options.stylize('NaN', 'number');
	  }

	  if (number === Infinity) {
	    return options.stylize('Infinity', 'number');
	  }

	  if (number === -Infinity) {
	    return options.stylize('-Infinity', 'number');
	  }

	  if (number === 0) {
	    return options.stylize(1 / number === Infinity ? '+0' : '-0', 'number');
	  }

	  return options.stylize(truncate(number, options.truncate), 'number');
	}

	function inspectRegExp(value, options) {
	  var flags = value.toString().split('/')[2];
	  var sourceLength = options.truncate - (2 + flags.length);
	  var source = value.source;
	  return options.stylize("/".concat(truncate(source, sourceLength), "/").concat(flags), 'regexp');
	}

	function arrayFromSet(set) {
	  var values = [];
	  set.forEach(function (value) {
	    values.push(value);
	  });
	  return values;
	}

	function inspectSet(set, options) {
	  if (set.size === 0) return 'Set{}';
	  options.truncate -= 7;
	  return "Set{ ".concat(inspectList(arrayFromSet(set), options), " }");
	}

	var stringEscapeChars = new RegExp("['\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5" + "\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]", 'g');
	var escapeCharacters = {
	  '\b': '\\b',
	  '\t': '\\t',
	  '\n': '\\n',
	  '\f': '\\f',
	  '\r': '\\r',
	  "'": "\\'",
	  '\\': '\\\\'
	};
	var hex = 16;
	var unicodeLength = 4;

	function escape(char) {
	  return escapeCharacters[char] || "\\u".concat("0000".concat(char.charCodeAt(0).toString(hex)).slice(-unicodeLength));
	}

	function inspectString(string, options) {
	  if (stringEscapeChars.test(string)) {
	    string = string.replace(stringEscapeChars, escape);
	  }

	  return options.stylize("'".concat(truncate(string, options.truncate - 2), "'"), 'string');
	}

	function inspectSymbol(value) {
	  if ('description' in Symbol.prototype) {
	    return "Symbol(".concat(value.description, ")");
	  }

	  return value.toString();
	}

	var getPromiseValue = function getPromiseValue() {
	  return 'Promise{…}';
	};

	try {
	  var _process$binding = process.binding('util'),
	      getPromiseDetails = _process$binding.getPromiseDetails,
	      kPending = _process$binding.kPending,
	      kRejected = _process$binding.kRejected;

	  getPromiseValue = function getPromiseValue(value, options) {
	    var _getPromiseDetails = getPromiseDetails(value),
	        _getPromiseDetails2 = _slicedToArray(_getPromiseDetails, 2),
	        state = _getPromiseDetails2[0],
	        innerValue = _getPromiseDetails2[1];

	    if (state === kPending) {
	      return 'Promise{<pending>}';
	    }

	    return "Promise".concat(state === kRejected ? '!' : '', "{").concat(options.inspect(innerValue, options), "}");
	  };
	} catch (notNode) {
	  /* ignore */
	}

	var inspectPromise = getPromiseValue;

	function inspectObject(object, options) {
	  var properties = Object.getOwnPropertyNames(object);
	  var symbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(object) : [];

	  if (properties.length === 0 && symbols.length === 0) {
	    return '{}';
	  }

	  options.truncate -= 4;
	  var propertyContents = inspectList(properties.map(function (key) {
	    return [key, object[key]];
	  }), options, inspectProperty);
	  var symbolContents = inspectList(symbols.map(function (key) {
	    return [key, object[key]];
	  }), options, inspectProperty);
	  var sep = '';

	  if (propertyContents && symbolContents) {
	    sep = ', ';
	  }

	  return "{ ".concat(propertyContents).concat(sep).concat(symbolContents, " }");
	}

	var toStringTag$1 = typeof Symbol !== 'undefined' && Symbol.toStringTag ? Symbol.toStringTag : false;
	function inspectClass(value, options) {
	  var name = '';

	  if (toStringTag$1 && toStringTag$1 in value) {
	    name = value[toStringTag$1];
	  }

	  name = name || getFuncName_1(value.constructor); // Babel transforms anonymous classes to the name `_class`

	  if (!name || name === '_class') {
	    name = '<Anonymous Class>';
	  }

	  options.truncate -= name.length;
	  return "".concat(name).concat(inspectObject(value, options));
	}

	function inspectArguments(args, options) {
	  if (args.length === 0) return 'Arguments[]';
	  options.truncate -= 13;
	  return "Arguments[ ".concat(inspectList(args, options), " ]");
	}

	var errorKeys = ['stack', 'line', 'column', 'name', 'message', 'fileName', 'lineNumber', 'columnNumber', 'number', 'description'];
	function inspectObject$1(error, options) {
	  var properties = Object.getOwnPropertyNames(error).filter(function (key) {
	    return errorKeys.indexOf(key) === -1;
	  });
	  var name = error.name;
	  options.truncate -= name.length;
	  var message = '';

	  if (typeof error.message === 'string') {
	    message = truncate(error.message, options.truncate);
	  } else {
	    properties.unshift('message');
	  }

	  message = message ? ": ".concat(message) : '';
	  options.truncate -= message.length + 5;
	  var propertyContents = inspectList(properties.map(function (key) {
	    return [key, error[key]];
	  }), options, inspectProperty);
	  return "".concat(name).concat(message).concat(propertyContents ? " { ".concat(propertyContents, " }") : '');
	}

	function inspectAttribute(_ref, options) {
	  var _ref2 = _slicedToArray(_ref, 2),
	      key = _ref2[0],
	      value = _ref2[1];

	  options.truncate -= 3;

	  if (!value) {
	    return "".concat(options.stylize(key, 'yellow'));
	  }

	  return "".concat(options.stylize(key, 'yellow'), "=").concat(options.stylize("\"".concat(value, "\""), 'string'));
	}
	function inspectHTMLCollection(collection, options) {
	  // eslint-disable-next-line no-use-before-define
	  return inspectList(collection, options, inspectHTML, '\n');
	}
	function inspectHTML(element, options) {
	  var properties = element.getAttributeNames();
	  var name = element.tagName.toLowerCase();
	  var head = options.stylize("<".concat(name), 'special');
	  var headClose = options.stylize(">", 'special');
	  var tail = options.stylize("</".concat(name, ">"), 'special');
	  options.truncate -= name.length * 2 + 5;
	  var propertyContents = '';

	  if (properties.length > 0) {
	    propertyContents += ' ';
	    propertyContents += inspectList(properties.map(function (key) {
	      return [key, element.getAttribute(key)];
	    }), options, inspectAttribute, ' ');
	  }

	  options.truncate -= propertyContents.length;
	  var truncate = options.truncate;
	  var children = inspectHTMLCollection(element.children, options);

	  if (children && children.length > truncate) {
	    children = "".concat(truncator, "(").concat(element.children.length, ")");
	  }

	  return "".concat(head).concat(propertyContents).concat(headClose).concat(children).concat(tail);
	}

	/* !
	 * loupe
	 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var symbolsSupported = typeof Symbol === 'function' && typeof Symbol.for === 'function';
	var chaiInspect = symbolsSupported ? Symbol.for('chai/inspect') : '@@chai/inspect';
	var nodeInspect = false;

	try {
	  // eslint-disable-next-line global-require
	  nodeInspect = require('util').inspect.custom;
	} catch (noNodeInspect) {
	  nodeInspect = false;
	}

	var constructorMap = new WeakMap();
	var stringTagMap = {};
	var baseTypesMap = {
	  undefined: function undefined$1(value, options) {
	    return options.stylize('undefined', 'undefined');
	  },
	  null: function _null(value, options) {
	    return options.stylize(null, 'null');
	  },
	  boolean: function boolean(value, options) {
	    return options.stylize(value, 'boolean');
	  },
	  Boolean: function Boolean(value, options) {
	    return options.stylize(value, 'boolean');
	  },
	  number: inspectNumber,
	  Number: inspectNumber,
	  string: inspectString,
	  String: inspectString,
	  function: inspectFunction,
	  Function: inspectFunction,
	  symbol: inspectSymbol,
	  // A Symbol polyfill will return `Symbol` not `symbol` from typedetect
	  Symbol: inspectSymbol,
	  Array: inspectArray,
	  Date: inspectDate,
	  Map: inspectMap,
	  Set: inspectSet,
	  RegExp: inspectRegExp,
	  Promise: inspectPromise,
	  // WeakSet, WeakMap are totally opaque to us
	  WeakSet: function WeakSet(value, options) {
	    return options.stylize('WeakSet{…}', 'special');
	  },
	  WeakMap: function WeakMap(value, options) {
	    return options.stylize('WeakMap{…}', 'special');
	  },
	  Arguments: inspectArguments,
	  Int8Array: inspectTypedArray,
	  Uint8Array: inspectTypedArray,
	  Uint8ClampedArray: inspectTypedArray,
	  Int16Array: inspectTypedArray,
	  Uint16Array: inspectTypedArray,
	  Int32Array: inspectTypedArray,
	  Uint32Array: inspectTypedArray,
	  Float32Array: inspectTypedArray,
	  Float64Array: inspectTypedArray,
	  Generator: function Generator() {
	    return '';
	  },
	  DataView: function DataView() {
	    return '';
	  },
	  ArrayBuffer: function ArrayBuffer() {
	    return '';
	  },
	  Error: inspectObject$1,
	  HTMLCollection: inspectHTMLCollection,
	  NodeList: inspectHTMLCollection
	}; // eslint-disable-next-line complexity

	var inspectCustom = function inspectCustom(value, options, type) {
	  if (chaiInspect in value && typeof value[chaiInspect] === 'function') {
	    return value[chaiInspect](options);
	  }

	  if (nodeInspect && nodeInspect in value && typeof value[nodeInspect] === 'function') {
	    return value[nodeInspect](options.depth, options);
	  }

	  if ('inspect' in value && typeof value.inspect === 'function') {
	    return value.inspect(options.depth, options);
	  }

	  if ('constructor' in value && constructorMap.has(value.constructor)) {
	    return constructorMap.get(value.constructor)(value, options);
	  }

	  if (stringTagMap[type]) {
	    return stringTagMap[type](value, options);
	  }

	  return '';
	}; // eslint-disable-next-line complexity


	function inspect(value, options) {
	  options = normaliseOptions(options);
	  options.inspect = inspect;
	  var _options = options,
	      customInspect = _options.customInspect;
	  var type = typeDetect(value); // If it is a base value that we already support, then use Loupe's inspector

	  if (baseTypesMap[type]) {
	    return baseTypesMap[type](value, options);
	  }

	  var proto = value ? Object.getPrototypeOf(value) : false; // If it's a plain Object then use Loupe's inspector

	  if (proto === Object.prototype || proto === null) {
	    return inspectObject(value, options);
	  } // Specifically account for HTMLElements
	  // eslint-disable-next-line no-undef


	  if (value && typeof HTMLElement === 'function' && value instanceof HTMLElement) {
	    return inspectHTML(value, options);
	  } // If `options.customInspect` is set to true then try to use the custom inspector


	  if (customInspect && value) {
	    var output = inspectCustom(value, options, type);
	    if (output) return output;
	  } // If it is a class, inspect it like an object but add the constructor name


	  if ('constructor' in value && value.constructor !== Object) {
	    return inspectClass(value, options);
	  } // We have run out of options! Just stringify the value


	  return options.stylize(String(value), type);
	}
	function registerConstructor(constructor, inspector) {
	  if (constructorMap.has(constructor)) {
	    return false;
	  }

	  constructorMap.add(constructor, inspector);
	  return true;
	}
	function registerStringTag(stringTag, inspector) {
	  if (stringTag in stringTagMap) {
	    return false;
	  }

	  stringTagMap[stringTag] = inspector;
	  return true;
	}
	var custom = chaiInspect;

	exports.custom = custom;
	exports.default = inspect;
	exports.inspect = inspect;
	exports.registerConstructor = registerConstructor;
	exports.registerStringTag = registerStringTag;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

}).call(this)}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"_process":24,"buffer":4,"util":27}],34:[function(require,module,exports){

var type = require('./jkroso-type')

// (any, any, [array]) -> boolean
function equal(a, b, memos){
  // All identical values are equivalent
  if (a === b) return true
  var fnA = types[type(a)]
  var fnB = types[type(b)]
  return fnA && fnA === fnB
    ? fnA(a, b, memos)
    : false
}

var types = {}

// (Number) -> boolean
types.number = function(a, b){
  return a !== a && b !== b/*Nan check*/
}

// (function, function, array) -> boolean
types['function'] = function(a, b, memos){
  return a.toString() === b.toString()
    // Functions can act as objects
    && types.object(a, b, memos)
    && equal(a.prototype, b.prototype)
}

// (date, date) -> boolean
types.date = function(a, b){
  return +a === +b
}

// (regexp, regexp) -> boolean
types.regexp = function(a, b){
  return a.toString() === b.toString()
}

// (DOMElement, DOMElement) -> boolean
types.element = function(a, b){
  return a.outerHTML === b.outerHTML
}

// (textnode, textnode) -> boolean
types.textnode = function(a, b){
  return a.textContent === b.textContent
}

// decorate fn to prevent it re-checking objects
// (function) -> function
function memoGaurd(fn){
  return function(a, b, memos){
    if (!memos) return fn(a, b, [])
    var i = memos.length, memo
    while (memo = memos[--i]) {
      if (memo[0] === a && memo[1] === b) return true
    }
    return fn(a, b, memos)
  }
}

types['arguments'] =
types['bit-array'] =
types.array = memoGaurd(arrayEqual)

// (array, array, array) -> boolean
function arrayEqual(a, b, memos){
  var i = a.length
  if (i !== b.length) return false
  memos.push([a, b])
  while (i--) {
    if (!equal(a[i], b[i], memos)) return false
  }
  return true
}

types.object = memoGaurd(objectEqual)

// (object, object, array) -> boolean
function objectEqual(a, b, memos) {
  if (typeof a.equal == 'function') {
    memos.push([a, b])
    return a.equal(b, memos)
  }
  var ka = getEnumerableProperties(a)
  var kb = getEnumerableProperties(b)
  var i = ka.length

  // same number of properties
  if (i !== kb.length) return false

  // although not necessarily the same order
  ka.sort()
  kb.sort()

  // cheap key test
  while (i--) if (ka[i] !== kb[i]) return false

  // remember
  memos.push([a, b])

  // iterate again this time doing a thorough check
  i = ka.length
  while (i--) {
    var key = ka[i]
    if (!equal(a[key], b[key], memos)) return false
  }

  return true
}

// (object) -> array
function getEnumerableProperties (object) {
  var result = []
  for (var k in object) if (k !== 'constructor') {
    result.push(k)
  }
  return result
}

module.exports = equal


},{"./jkroso-type":35}],35:[function(require,module,exports){

var toString = {}.toString
var DomNode = typeof window != 'undefined'
  ? window.Node
  : Function // could be any function

/**
 * Return the type of val.
 *
 * @param {Mixed} val
 * @return {String}
 * @api public
 */

module.exports = exports = function type(x){
  var type = typeof x
  if (type != 'object') return type
  type = types[toString.call(x)]
  if (type == 'object') {
    // in case they have been polyfilled
    if (x instanceof Map) return 'map'
    if (x instanceof Set) return 'set'
    return 'object'
  }
  if (type) return type
  if (x instanceof DomNode) switch (x.nodeType) {
    case 1:  return 'element'
    case 3:  return 'text-node'
    case 9:  return 'document'
    case 11: return 'document-fragment'
    default: return 'dom-node'
  }
}

var types = exports.types = {
  '[object Function]': 'function',
  '[object Date]': 'date',
  '[object RegExp]': 'regexp',
  '[object Arguments]': 'arguments',
  '[object Array]': 'array',
  '[object Set]': 'set',
  '[object String]': 'string',
  '[object Null]': 'null',
  '[object Undefined]': 'undefined',
  '[object Number]': 'number',
  '[object Boolean]': 'boolean',
  '[object Object]': 'object',
  '[object Map]': 'map',
  '[object Text]': 'text-node',
  '[object Uint8Array]': 'bit-array',
  '[object Uint16Array]': 'bit-array',
  '[object Uint32Array]': 'bit-array',
  '[object Uint8ClampedArray]': 'bit-array',
  '[object Error]': 'error',
  '[object FormData]': 'form-data',
  '[object File]': 'file',
  '[object Blob]': 'blob'
}


},{}],36:[function(require,module,exports){
(function (global,Buffer){(function (){
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.loupe = {}));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn) {
	  var module = { exports: {} };
		return fn(module, module.exports), module.exports;
	}

	var typeDetect = createCommonjsModule(function (module, exports) {
	(function (global, factory) {
		 module.exports = factory() ;
	}(commonjsGlobal, (function () {
	/* !
	 * type-detect
	 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var promiseExists = typeof Promise === 'function';

	/* eslint-disable no-undef */
	var globalObject = typeof self === 'object' ? self : commonjsGlobal; // eslint-disable-line id-blacklist

	var symbolExists = typeof Symbol !== 'undefined';
	var mapExists = typeof Map !== 'undefined';
	var setExists = typeof Set !== 'undefined';
	var weakMapExists = typeof WeakMap !== 'undefined';
	var weakSetExists = typeof WeakSet !== 'undefined';
	var dataViewExists = typeof DataView !== 'undefined';
	var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
	var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
	var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
	var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
	var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
	var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
	var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
	var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
	var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
	var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
	var toStringLeftSliceLength = 8;
	var toStringRightSliceLength = -1;
	/**
	 * ### typeOf (obj)
	 *
	 * Uses `Object.prototype.toString` to determine the type of an object,
	 * normalising behaviour across engine versions & well optimised.
	 *
	 * @param {Mixed} object
	 * @return {String} object type
	 * @api public
	 */
	function typeDetect(obj) {
	  /* ! Speed optimisation
	   * Pre:
	   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
	   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
	   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
	   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
	   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
	   * Post:
	   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
	   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
	   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
	   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
	   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
	   */
	  var typeofObj = typeof obj;
	  if (typeofObj !== 'object') {
	    return typeofObj;
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
	   * Post:
	   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
	   */
	  if (obj === null) {
	    return 'null';
	  }

	  /* ! Spec Conformance
	   * Test: `Object.prototype.toString.call(window)``
	   *  - Node === "[object global]"
	   *  - Chrome === "[object global]"
	   *  - Firefox === "[object Window]"
	   *  - PhantomJS === "[object Window]"
	   *  - Safari === "[object Window]"
	   *  - IE 11 === "[object Window]"
	   *  - IE Edge === "[object Window]"
	   * Test: `Object.prototype.toString.call(this)``
	   *  - Chrome Worker === "[object global]"
	   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
	   *  - IE 11 Worker === "[object WorkerGlobalScope]"
	   *  - IE Edge Worker === "[object WorkerGlobalScope]"
	   */
	  if (obj === globalObject) {
	    return 'global';
	  }

	  /* ! Speed optimisation
	   * Pre:
	   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
	   * Post:
	   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
	   */
	  if (
	    Array.isArray(obj) &&
	    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
	  ) {
	    return 'Array';
	  }

	  // Not caching existence of `window` and related properties due to potential
	  // for `window` to be unset before tests in quasi-browser environments.
	  if (typeof window === 'object' && window !== null) {
	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
	     * WhatWG HTML$7.7.3 - The `Location` interface
	     * Test: `Object.prototype.toString.call(window.location)``
	     *  - IE <=11 === "[object Object]"
	     *  - IE Edge <=13 === "[object Object]"
	     */
	    if (typeof window.location === 'object' && obj === window.location) {
	      return 'Location';
	    }

	    /* ! Spec Conformance
	     * (https://html.spec.whatwg.org/#document)
	     * WhatWG HTML$3.1.1 - The `Document` object
	     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
	     *       which suggests that browsers should use HTMLTableCellElement for
	     *       both TD and TH elements. WhatWG separates these.
	     *       WhatWG HTML states:
	     *         > For historical reasons, Window objects must also have a
	     *         > writable, configurable, non-enumerable property named
	     *         > HTMLDocument whose value is the Document interface object.
	     * Test: `Object.prototype.toString.call(document)``
	     *  - Chrome === "[object HTMLDocument]"
	     *  - Firefox === "[object HTMLDocument]"
	     *  - Safari === "[object HTMLDocument]"
	     *  - IE <=10 === "[object Document]"
	     *  - IE 11 === "[object HTMLDocument]"
	     *  - IE Edge <=13 === "[object HTMLDocument]"
	     */
	    if (typeof window.document === 'object' && obj === window.document) {
	      return 'Document';
	    }

	    if (typeof window.navigator === 'object') {
	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
	       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
	       *  - IE <=10 === "[object MSMimeTypesCollection]"
	       */
	      if (typeof window.navigator.mimeTypes === 'object' &&
	          obj === window.navigator.mimeTypes) {
	        return 'MimeTypeArray';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
	       * Test: `Object.prototype.toString.call(navigator.plugins)``
	       *  - IE <=10 === "[object MSPluginsCollection]"
	       */
	      if (typeof window.navigator.plugins === 'object' &&
	          obj === window.navigator.plugins) {
	        return 'PluginArray';
	      }
	    }

	    if ((typeof window.HTMLElement === 'function' ||
	        typeof window.HTMLElement === 'object') &&
	        obj instanceof window.HTMLElement) {
	      /* ! Spec Conformance
	      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
	      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
	      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
	      *  - IE <=10 === "[object HTMLBlockElement]"
	      */
	      if (obj.tagName === 'BLOCKQUOTE') {
	        return 'HTMLQuoteElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('td'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TD') {
	        return 'HTMLTableDataCellElement';
	      }

	      /* ! Spec Conformance
	       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
	       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
	       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
	       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
	       *       which suggests that browsers should use HTMLTableCellElement for
	       *       both TD and TH elements. WhatWG separates these.
	       * Test: Object.prototype.toString.call(document.createElement('th'))
	       *  - Chrome === "[object HTMLTableCellElement]"
	       *  - Firefox === "[object HTMLTableCellElement]"
	       *  - Safari === "[object HTMLTableCellElement]"
	       */
	      if (obj.tagName === 'TH') {
	        return 'HTMLTableHeaderCellElement';
	      }
	    }
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
	  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
	  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
	  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
	  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
	  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
	  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
	  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
	  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
	  * Post:
	  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
	  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
	  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
	  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
	  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
	  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
	  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
	  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
	  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
	  */
	  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
	  if (typeof stringTag === 'string') {
	    return stringTag;
	  }

	  var objPrototype = Object.getPrototypeOf(obj);
	  /* ! Speed optimisation
	  * Pre:
	  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
	  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
	  * Post:
	  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
	  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
	  */
	  if (objPrototype === RegExp.prototype) {
	    return 'RegExp';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
	  * Post:
	  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
	  */
	  if (objPrototype === Date.prototype) {
	    return 'Date';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
	   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
	   * Test: `Object.prototype.toString.call(Promise.resolve())``
	   *  - Chrome <=47 === "[object Object]"
	   *  - Edge <=20 === "[object Object]"
	   *  - Firefox 29-Latest === "[object Promise]"
	   *  - Safari 7.1-Latest === "[object Promise]"
	   */
	  if (promiseExists && objPrototype === Promise.prototype) {
	    return 'Promise';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
	  * Post:
	  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
	  */
	  if (setExists && objPrototype === Set.prototype) {
	    return 'Set';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
	  * Post:
	  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
	  */
	  if (mapExists && objPrototype === Map.prototype) {
	    return 'Map';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
	  * Post:
	  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
	  */
	  if (weakSetExists && objPrototype === WeakSet.prototype) {
	    return 'WeakSet';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
	  * Post:
	  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
	  */
	  if (weakMapExists && objPrototype === WeakMap.prototype) {
	    return 'WeakMap';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
	   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
	   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (dataViewExists && objPrototype === DataView.prototype) {
	    return 'DataView';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
	   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
	   * Test: `Object.prototype.toString.call(new Map().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (mapExists && objPrototype === mapIteratorPrototype) {
	    return 'Map Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
	   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
	   * Test: `Object.prototype.toString.call(new Set().entries())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (setExists && objPrototype === setIteratorPrototype) {
	    return 'Set Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
	   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
	   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
	    return 'Array Iterator';
	  }

	  /* ! Spec Conformance
	   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
	   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
	   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
	   *  - Edge <=13 === "[object Object]"
	   */
	  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
	    return 'String Iterator';
	  }

	  /* ! Speed optimisation
	  * Pre:
	  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
	  * Post:
	  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
	  */
	  if (objPrototype === null) {
	    return 'Object';
	  }

	  return Object
	    .prototype
	    .toString
	    .call(obj)
	    .slice(toStringLeftSliceLength, toStringRightSliceLength);
	}

	return typeDetect;

	})));
	});

	function _slicedToArray(arr, i) {
	  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
	}

	function _arrayWithHoles(arr) {
	  if (Array.isArray(arr)) return arr;
	}

	function _iterableToArrayLimit(arr, i) {
	  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
	  var _arr = [];
	  var _n = true;
	  var _d = false;
	  var _e = undefined;

	  try {
	    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	      _arr.push(_s.value);

	      if (i && _arr.length === i) break;
	    }
	  } catch (err) {
	    _d = true;
	    _e = err;
	  } finally {
	    try {
	      if (!_n && _i["return"] != null) _i["return"]();
	    } finally {
	      if (_d) throw _e;
	    }
	  }

	  return _arr;
	}

	function _unsupportedIterableToArray(o, minLen) {
	  if (!o) return;
	  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
	  var n = Object.prototype.toString.call(o).slice(8, -1);
	  if (n === "Object" && o.constructor) n = o.constructor.name;
	  if (n === "Map" || n === "Set") return Array.from(o);
	  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
	}

	function _arrayLikeToArray(arr, len) {
	  if (len == null || len > arr.length) len = arr.length;

	  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

	  return arr2;
	}

	function _nonIterableRest() {
	  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
	}

	var ansiColors = {
	  bold: ['1', '22'],
	  dim: ['2', '22'],
	  italic: ['3', '23'],
	  underline: ['4', '24'],
	  // 5 & 6 are blinking
	  inverse: ['7', '27'],
	  hidden: ['8', '28'],
	  strike: ['9', '29'],
	  // 10-20 are fonts
	  // 21-29 are resets for 1-9
	  black: ['30', '39'],
	  red: ['31', '39'],
	  green: ['32', '39'],
	  yellow: ['33', '39'],
	  blue: ['34', '39'],
	  magenta: ['35', '39'],
	  cyan: ['36', '39'],
	  white: ['37', '39'],
	  brightblack: ['30;1', '39'],
	  brightred: ['31;1', '39'],
	  brightgreen: ['32;1', '39'],
	  brightyellow: ['33;1', '39'],
	  brightblue: ['34;1', '39'],
	  brightmagenta: ['35;1', '39'],
	  brightcyan: ['36;1', '39'],
	  brightwhite: ['37;1', '39'],
	  grey: ['90', '39']
	};
	var styles = {
	  special: 'cyan',
	  number: 'yellow',
	  boolean: 'yellow',
	  undefined: 'grey',
	  null: 'bold',
	  string: 'green',
	  symbol: 'green',
	  date: 'magenta',
	  regexp: 'red'
	};
	var truncator = '…';

	function colorise(value, styleType) {
	  var color = ansiColors[styles[styleType]] || ansiColors[styleType];

	  if (!color) {
	    return String(value);
	  }

	  return "\x1B[".concat(color[0], "m").concat(String(value), "\x1B[").concat(color[1], "m");
	}

	function normaliseOptions() {
	  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
	      _ref$showHidden = _ref.showHidden,
	      showHidden = _ref$showHidden === void 0 ? false : _ref$showHidden,
	      _ref$depth = _ref.depth,
	      depth = _ref$depth === void 0 ? 2 : _ref$depth,
	      _ref$colors = _ref.colors,
	      colors = _ref$colors === void 0 ? false : _ref$colors,
	      _ref$customInspect = _ref.customInspect,
	      customInspect = _ref$customInspect === void 0 ? true : _ref$customInspect,
	      _ref$showProxy = _ref.showProxy,
	      showProxy = _ref$showProxy === void 0 ? false : _ref$showProxy,
	      _ref$maxArrayLength = _ref.maxArrayLength,
	      maxArrayLength = _ref$maxArrayLength === void 0 ? Infinity : _ref$maxArrayLength,
	      _ref$breakLength = _ref.breakLength,
	      breakLength = _ref$breakLength === void 0 ? Infinity : _ref$breakLength,
	      _ref$seen = _ref.seen,
	      seen = _ref$seen === void 0 ? [] : _ref$seen,
	      _ref$truncate = _ref.truncate,
	      truncate = _ref$truncate === void 0 ? Infinity : _ref$truncate,
	      _ref$stylize = _ref.stylize,
	      stylize = _ref$stylize === void 0 ? String : _ref$stylize;

	  var options = {
	    showHidden: Boolean(showHidden),
	    depth: Number(depth),
	    colors: Boolean(colors),
	    customInspect: Boolean(customInspect),
	    showProxy: Boolean(showProxy),
	    maxArrayLength: Number(maxArrayLength),
	    breakLength: Number(breakLength),
	    truncate: Number(truncate),
	    seen: seen,
	    stylize: stylize
	  };

	  if (options.colors) {
	    options.stylize = colorise;
	  }

	  return options;
	}
	function truncate(string, length) {
	  var tail = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : truncator;
	  string = String(string);
	  var tailLength = tail.length;
	  var stringLength = string.length;

	  if (tailLength > length && stringLength > tailLength) {
	    return tail;
	  }

	  if (stringLength > length && stringLength > tailLength) {
	    return "".concat(string.slice(0, length - tailLength)).concat(tail);
	  }

	  return string;
	} // eslint-disable-next-line complexity

	function inspectList(list, options, inspectItem) {
	  var separator = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ', ';
	  inspectItem = inspectItem || options.inspect;
	  var size = list.length;
	  if (size === 0) return '';
	  var originalLength = options.truncate;
	  var output = '';
	  var peek = '';
	  var truncated = '';

	  for (var i = 0; i < size; i += 1) {
	    var last = i + 1 === list.length;
	    var secondToLast = i + 2 === list.length;
	    truncated = "".concat(truncator, "(").concat(list.length - i, ")");
	    var value = list[i]; // If there is more than one remaining we need to account for a separator of `, `

	    options.truncate = originalLength - output.length - (last ? 0 : separator.length);
	    var string = peek || inspectItem(value, options) + (last ? '' : separator);
	    var nextLength = output.length + string.length;
	    var truncatedLength = nextLength + truncated.length; // If this is the last element, and adding it would
	    // take us over length, but adding the truncator wouldn't - then break now

	    if (last && nextLength > originalLength && output.length + truncated.length <= originalLength) {
	      break;
	    } // If this isn't the last or second to last element to scan,
	    // but the string is already over length then break here


	    if (!last && !secondToLast && truncatedLength > originalLength) {
	      break;
	    } // Peek at the next string to determine if we should
	    // break early before adding this item to the output


	    peek = last ? '' : inspectItem(list[i + 1], options) + (secondToLast ? '' : separator); // If we have one element left, but this element and
	    // the next takes over length, the break early

	    if (!last && secondToLast && truncatedLength > originalLength && nextLength + peek.length > originalLength) {
	      break;
	    }

	    output += string; // If the next element takes us to length -
	    // but there are more after that, then we should truncate now

	    if (!last && !secondToLast && nextLength + peek.length >= originalLength) {
	      truncated = "".concat(truncator, "(").concat(list.length - i - 1, ")");
	      break;
	    }

	    truncated = '';
	  }

	  return "".concat(output).concat(truncated);
	}
	function inspectProperty(_ref2, options) {
	  var _ref3 = _slicedToArray(_ref2, 2),
	      key = _ref3[0],
	      value = _ref3[1];

	  options.truncate -= 2;

	  if (typeof key !== 'string' && typeof key !== 'number') {
	    key = "[".concat(options.inspect(key, options), "]");
	  }

	  options.truncate -= key.length;
	  value = options.inspect(value, options);
	  return "".concat(key, ": ").concat(value);
	}

	function inspectArray(array, options) {
	  // Object.keys will always output the Array indices first, so we can slice by
	  // `array.length` to get non-index properties
	  var nonIndexProperties = Object.keys(array).slice(array.length);
	  if (!array.length && !nonIndexProperties.length) return '[]';
	  options.truncate -= 4;
	  var listContents = inspectList(array, options);
	  options.truncate -= listContents.length;
	  var propertyContents = '';

	  if (nonIndexProperties.length) {
	    propertyContents = inspectList(nonIndexProperties.map(function (key) {
	      return [key, array[key]];
	    }), options, inspectProperty);
	  }

	  return "[ ".concat(listContents).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
	}

	/* !
	 * Chai - getFuncName utility
	 * Copyright(c) 2012-2016 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */

	/**
	 * ### .getFuncName(constructorFn)
	 *
	 * Returns the name of a function.
	 * When a non-function instance is passed, returns `null`.
	 * This also includes a polyfill function if `aFunc.name` is not defined.
	 *
	 * @name getFuncName
	 * @param {Function} funct
	 * @namespace Utils
	 * @api public
	 */

	var toString = Function.prototype.toString;
	var functionNameMatch = /\s*function(?:\s|\s*\/\*[^(?:*\/)]+\*\/\s*)*([^\s\(\/]+)/;
	function getFuncName(aFunc) {
	  if (typeof aFunc !== 'function') {
	    return null;
	  }

	  var name = '';
	  if (typeof Function.prototype.name === 'undefined' && typeof aFunc.name === 'undefined') {
	    // Here we run a polyfill if Function does not support the `name` property and if aFunc.name is not defined
	    var match = toString.call(aFunc).match(functionNameMatch);
	    if (match) {
	      name = match[1];
	    }
	  } else {
	    // If we've got a `name` property we just use it
	    name = aFunc.name;
	  }

	  return name;
	}

	var getFuncName_1 = getFuncName;

	var getArrayName = function getArrayName(array) {
	  // We need to special case Node.js' Buffers, which report to be Uint8Array
	  if (typeof Buffer === 'function' && array instanceof Buffer) {
	    return 'Buffer';
	  }

	  if (array[Symbol.toStringTag]) {
	    return array[Symbol.toStringTag];
	  }

	  return getFuncName_1(array.constructor);
	};

	function inspectTypedArray(array, options) {
	  var name = getArrayName(array);
	  options.truncate -= name.length + 4; // Object.keys will always output the Array indices first, so we can slice by
	  // `array.length` to get non-index properties

	  var nonIndexProperties = Object.keys(array).slice(array.length);
	  if (!array.length && !nonIndexProperties.length) return "".concat(name, "[]"); // As we know TypedArrays only contain Unsigned Integers, we can skip inspecting each one and simply
	  // stylise the toString() value of them

	  var output = '';

	  for (var i = 0; i < array.length; i++) {
	    var string = "".concat(options.stylize(truncate(array[i], options.truncate), 'number')).concat(i === array.length - 1 ? '' : ', ');
	    options.truncate -= string.length;

	    if (array[i] !== array.length && options.truncate <= 3) {
	      output += "".concat(truncator, "(").concat(array.length - array[i] + 1, ")");
	      break;
	    }

	    output += string;
	  }

	  var propertyContents = '';

	  if (nonIndexProperties.length) {
	    propertyContents = inspectList(nonIndexProperties.map(function (key) {
	      return [key, array[key]];
	    }), options, inspectProperty);
	  }

	  return "".concat(name, "[ ").concat(output).concat(propertyContents ? ", ".concat(propertyContents) : '', " ]");
	}

	function inspectDate(dateObject, options) {
	  // If we need to - truncate the time portion, but never the date
	  var split = dateObject.toJSON().split('T');
	  var date = split[0];
	  return options.stylize("".concat(date, "T").concat(truncate(split[1], options.truncate - date.length - 1)), 'date');
	}

	var toString$1 = Object.prototype.toString;

	var getFunctionName = function(fn) {
	  if (toString$1.call(fn) !== '[object Function]') return null
	  if (fn.name) return fn.name
	  try {
		  var name = /^\s*function\s*([^\(]*)/im.exec(fn.toString())[1];
	  } catch ( e ) { return 'anonymous' };
	  return name || 'anonymous'
	};

	function inspectFunction(func, options) {
	  var name = getFunctionName(func);

	  if (name === 'anonymous') {
	    return options.stylize('[Function]', 'special');
	  }

	  return options.stylize("[Function ".concat(truncate(name, options.truncate - 11), "]"), 'special');
	}

	function inspectMapEntry(_ref, options) {
	  var _ref2 = _slicedToArray(_ref, 2),
	      key = _ref2[0],
	      value = _ref2[1];

	  options.truncate -= 4;
	  key = options.inspect(key, options);
	  options.truncate -= key.length;
	  value = options.inspect(value, options);
	  return "".concat(key, " => ").concat(value);
	} // IE11 doesn't support `map.entries()`


	function mapToEntries(map) {
	  var entries = [];
	  map.forEach(function (value, key) {
	    entries.push([key, value]);
	  });
	  return entries;
	}

	function inspectMap(map, options) {
	  var size = map.size - 1;

	  if (size <= 0) {
	    return 'Map{}';
	  }

	  options.truncate -= 7;
	  return "Map{ ".concat(inspectList(mapToEntries(map), options, inspectMapEntry), " }");
	}

	var isNaN = Number.isNaN || function (i) {
	  return i !== i;
	}; // eslint-disable-line no-self-compare


	function inspectNumber(number, options) {
	  if (isNaN(number)) {
	    return options.stylize('NaN', 'number');
	  }

	  if (number === Infinity) {
	    return options.stylize('Infinity', 'number');
	  }

	  if (number === -Infinity) {
	    return options.stylize('-Infinity', 'number');
	  }

	  if (number === 0) {
	    return options.stylize(1 / number === Infinity ? '+0' : '-0', 'number');
	  }

	  return options.stylize(truncate(number, options.truncate), 'number');
	}

	function inspectRegExp(value, options) {
	  var flags = value.toString().split('/')[2];
	  var sourceLength = options.truncate - (2 + flags.length);
	  var source = value.source;
	  return options.stylize("/".concat(truncate(source, sourceLength), "/").concat(flags), 'regexp');
	}

	function arrayFromSet(set) {
	  var values = [];
	  set.forEach(function (value) {
	    values.push(value);
	  });
	  return values;
	}

	function inspectSet(set, options) {
	  if (set.size === 0) return 'Set{}';
	  options.truncate -= 7;
	  return "Set{ ".concat(inspectList(arrayFromSet(set), options), " }");
	}

	var stringEscapeChars = new RegExp("['\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5" + "\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]", 'g');
	var escapeCharacters = {
	  '\b': '\\b',
	  '\t': '\\t',
	  '\n': '\\n',
	  '\f': '\\f',
	  '\r': '\\r',
	  "'": "\\'",
	  '\\': '\\\\'
	};
	var hex = 16;
	var unicodeLength = 4;

	function escape(char) {
	  return escapeCharacters[char] || "\\u".concat("0000".concat(char.charCodeAt(0).toString(hex)).slice(-unicodeLength));
	}

	function inspectString(string, options) {
	  if (stringEscapeChars.test(string)) {
	    string = string.replace(stringEscapeChars, escape);
	  }

	  return options.stylize("'".concat(truncate(string, options.truncate - 2), "'"), 'string');
	}

	function inspectSymbol(value) {
	  if ('description' in Symbol.prototype) {
	    return value.description ? "Symbol(".concat(value.description, ")") : 'Symbol()';
	  }

	  return value.toString();
	}

	var getPromiseValue = function getPromiseValue() {
	  return 'Promise{…}';
	};

	// try {
	//   var _process$binding = process.binding('util'),
	//       getPromiseDetails = _process$binding.getPromiseDetails,
	//       kPending = _process$binding.kPending,
	//       kRejected = _process$binding.kRejected;

	//   getPromiseValue = function getPromiseValue(value, options) {
	//     var _getPromiseDetails = getPromiseDetails(value),
	//         _getPromiseDetails2 = _slicedToArray(_getPromiseDetails, 2),
	//         state = _getPromiseDetails2[0],
	//         innerValue = _getPromiseDetails2[1];

	//     if (state === kPending) {
	//       return 'Promise{<pending>}';
	//     }

	//     return "Promise".concat(state === kRejected ? '!' : '', "{").concat(options.inspect(innerValue, options), "}");
	//   };
	// } catch (notNode) {
	//   /* ignore */
	// }

	var inspectPromise = getPromiseValue;

	function inspectObject(object, options) {
	  var properties = Object.getOwnPropertyNames(object);
	  var symbols = Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(object) : [];

	  if (properties.length === 0 && symbols.length === 0) {
	    return '{}';
	  }

	  options.truncate -= 4;
	  var propertyContents = inspectList(properties.map(function (key) {
	    return [key, object[key]];
	  }), options, inspectProperty);
	  var symbolContents = inspectList(symbols.map(function (key) {
	    return [key, object[key]];
	  }), options, inspectProperty);
	  var sep = '';

	  if (propertyContents && symbolContents) {
	    sep = ', ';
	  }

	  return "{ ".concat(propertyContents).concat(sep).concat(symbolContents, " }");
	}

	var toStringTag = typeof Symbol !== 'undefined' && Symbol.toStringTag ? Symbol.toStringTag : false;
	function inspectClass(value, options) {
	  var name = '';

	  if (toStringTag && toStringTag in value) {
	    name = value[toStringTag];
	  }

	  name = name || getFuncName_1(value.constructor); // Babel transforms anonymous classes to the name `_class`

	  if (!name || name === '_class') {
	    name = '<Anonymous Class>';
	  }

	  options.truncate -= name.length;
	  return "".concat(name).concat(inspectObject(value, options));
	}

	function inspectArguments(args, options) {
	  if (args.length === 0) return 'Arguments[]';
	  options.truncate -= 13;
	  return "Arguments[ ".concat(inspectList(args, options), " ]");
	}

	var errorKeys = ['stack', 'line', 'column', 'name', 'message', 'fileName', 'lineNumber', 'columnNumber', 'number', 'description'];
	function inspectObject$1(error, options) {
	  var properties = Object.getOwnPropertyNames(error).filter(function (key) {
	    return errorKeys.indexOf(key) === -1;
	  });
	  var name = error.name;
	  options.truncate -= name.length;
	  var message = '';

	  if (typeof error.message === 'string') {
	    message = truncate(error.message, options.truncate);
	  } else {
	    properties.unshift('message');
	  }

	  message = message ? ": ".concat(message) : '';
	  options.truncate -= message.length + 5;
	  var propertyContents = inspectList(properties.map(function (key) {
	    return [key, error[key]];
	  }), options, inspectProperty);
	  return "".concat(name).concat(message).concat(propertyContents ? " { ".concat(propertyContents, " }") : '');
	}

	function inspectAttribute(_ref, options) {
	  var _ref2 = _slicedToArray(_ref, 2),
	      key = _ref2[0],
	      value = _ref2[1];

	  options.truncate -= 3;

	  if (!value) {
	    return "".concat(options.stylize(key, 'yellow'));
	  }

	  return "".concat(options.stylize(key, 'yellow'), "=").concat(options.stylize("\"".concat(value, "\""), 'string'));
	}
	function inspectHTMLCollection(collection, options) {
	  // eslint-disable-next-line no-use-before-define
	  return inspectList(collection, options, inspectHTML, '\n');
	}
	function inspectHTML(element, options) {
	  var properties = element.getAttributeNames();
	  var name = element.tagName.toLowerCase();
	  var head = options.stylize("<".concat(name), 'special');
	  var headClose = options.stylize(">", 'special');
	  var tail = options.stylize("</".concat(name, ">"), 'special');
	  options.truncate -= name.length * 2 + 5;
	  var propertyContents = '';

	  if (properties.length > 0) {
	    propertyContents += ' ';
	    propertyContents += inspectList(properties.map(function (key) {
	      return [key, element.getAttribute(key)];
	    }), options, inspectAttribute, ' ');
	  }

	  options.truncate -= propertyContents.length;
	  var truncate = options.truncate;
	  var children = inspectHTMLCollection(element.children, options);

	  if (children && children.length > truncate) {
	    children = "".concat(truncator, "(").concat(element.children.length, ")");
	  }

	  return "".concat(head).concat(propertyContents).concat(headClose).concat(children).concat(tail);
	}

	/* !
	 * loupe
	 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
	 * MIT Licensed
	 */
	var symbolsSupported = typeof Symbol === 'function' && typeof Symbol.for === 'function';
	var chaiInspect = symbolsSupported ? Symbol.for('chai/inspect') : '@@chai/inspect';
	var nodeInspect = false;

	try {
	  // eslint-disable-next-line global-require
	  nodeInspect = require('util').inspect.custom;
	} catch (noNodeInspect) {
	  nodeInspect = false;
	}

	var constructorMap = new WeakMap();
	var stringTagMap = {};
	var baseTypesMap = {
	  undefined: function undefined$1(value, options) {
	    return options.stylize('undefined', 'undefined');
	  },
	  null: function _null(value, options) {
	    return options.stylize(null, 'null');
	  },
	  boolean: function boolean(value, options) {
	    return options.stylize(value, 'boolean');
	  },
	  Boolean: function Boolean(value, options) {
	    return options.stylize(value, 'boolean');
	  },
	  number: inspectNumber,
	  Number: inspectNumber,
	  BigInt: inspectNumber,
	  bigint: inspectNumber,
	  string: inspectString,
	  String: inspectString,
	  function: inspectFunction,
	  Function: inspectFunction,
	  symbol: inspectSymbol,
	  // A Symbol polyfill will return `Symbol` not `symbol` from typedetect
	  Symbol: inspectSymbol,
	  Array: inspectArray,
	  Date: inspectDate,
	  Map: inspectMap,
	  Set: inspectSet,
	  RegExp: inspectRegExp,
	  Promise: inspectPromise,
	  // WeakSet, WeakMap are totally opaque to us
	  WeakSet: function WeakSet(value, options) {
	    return options.stylize('WeakSet{…}', 'special');
	  },
	  WeakMap: function WeakMap(value, options) {
	    return options.stylize('WeakMap{…}', 'special');
	  },
	  Arguments: inspectArguments,
	  Int8Array: inspectTypedArray,
	  Uint8Array: inspectTypedArray,
	  Uint8ClampedArray: inspectTypedArray,
	  Int16Array: inspectTypedArray,
	  Uint16Array: inspectTypedArray,
	  Int32Array: inspectTypedArray,
	  Uint32Array: inspectTypedArray,
	  Float32Array: inspectTypedArray,
	  Float64Array: inspectTypedArray,
	  Generator: function Generator() {
	    return '';
	  },
	  DataView: function DataView() {
	    return '';
	  },
	  ArrayBuffer: function ArrayBuffer() {
	    return '';
	  },
	  Error: inspectObject$1,
	  HTMLCollection: inspectHTMLCollection,
	  NodeList: inspectHTMLCollection
	}; // eslint-disable-next-line complexity

	var inspectCustom = function inspectCustom(value, options, type) {
	  if (chaiInspect in value && typeof value[chaiInspect] === 'function') {
	    return value[chaiInspect](options);
	  }

	  if (nodeInspect && nodeInspect in value && typeof value[nodeInspect] === 'function') {
	    return value[nodeInspect](options.depth, options);
	  }

	  if ('inspect' in value && typeof value.inspect === 'function') {
	    return value.inspect(options.depth, options);
	  }

	  if ('constructor' in value && constructorMap.has(value.constructor)) {
	    return constructorMap.get(value.constructor)(value, options);
	  }

	  if (stringTagMap[type]) {
	    return stringTagMap[type](value, options);
	  }

	  return '';
	}; // eslint-disable-next-line complexity


	function inspect(value, options) {
	  options = normaliseOptions(options);
	  options.inspect = inspect;
	  var _options = options,
	      customInspect = _options.customInspect;
	  var type = typeDetect(value); // If it is a base value that we already support, then use Loupe's inspector
	  if (baseTypesMap[type]) {
	    return baseTypesMap[type](value, options);
	  } // If `options.customInspect` is set to true then try to use the custom inspector


	  if (customInspect && value) {
	    var output = inspectCustom(value, options, type);
	    if (output) return inspect(output, options);
	  }

	  var proto = value ? Object.getPrototypeOf(value) : false; // If it's a plain Object then use Loupe's inspector

	  if (proto === Object.prototype || proto === null) {
	    return inspectObject(value, options);
	  } // Specifically account for HTMLElements
	  // eslint-disable-next-line no-undef


	  if (value && typeof HTMLElement === 'function' && value instanceof HTMLElement) {
	    return inspectHTML(value, options);
	  } // If it is a class, inspect it like an object but add the constructor name


	  if ('constructor' in value && value.constructor !== Object) {
	    return inspectClass(value, options);
	  } // We have run out of options! Just stringify the value


	  return options.stylize(String(value), type);
	}
	function registerConstructor(constructor, inspector) {
	  if (constructorMap.has(constructor)) {
	    return false;
	  }

	  constructorMap.add(constructor, inspector);
	  return true;
	}
	function registerStringTag(stringTag, inspector) {
	  if (stringTag in stringTagMap) {
	    return false;
	  }

	  stringTagMap[stringTag] = inspector;
	  return true;
	}
	var custom = chaiInspect;

	exports.custom = custom;
	exports.default = inspect;
	exports.inspect = inspect;
	exports.registerConstructor = registerConstructor;
	exports.registerStringTag = registerStringTag;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)

},{"buffer":4,"util":27}],37:[function(require,module,exports){
(function() {
  'use strict';
  var js_type_of, rpr, sad;

  //###########################################################################################################
  this.sad = sad = Symbol('sad');

  ({rpr, js_type_of} = require('./helpers'));

  //-----------------------------------------------------------------------------------------------------------
  this.is_sad = function(x) {
    return (x === sad) || (x instanceof Error) || (this.is_saddened(x));
  };

  this.is_happy = function(x) {
    return !this.is_sad(x);
  };

  this.sadden = function(x) {
    return {
      [sad]: true,
      _: x
    };
  };

  this.is_saddened = function(x) {
    return ((js_type_of(x)) === 'object') && (x[sad] === true);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.unsadden = function(x) {
    if (this.is_happy(x)) {
      return x;
    }
    this.validate.saddened(x);
    return x._;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.declare_check = function(name, checker) {
    this.validate.nonempty_text(name);
    this.validate.function(checker);
    if (this.specs[name] != null) {
      throw new Error(`µ8032 type ${rpr(name)} already declared`);
    }
    if (this.checks[name] != null) {
      throw new Error(`µ8033 check ${rpr(name)} already declared`);
    }
    this.checks[name] = checker;
    return null;
  };

}).call(this);


},{"./helpers":40}],38:[function(require,module,exports){
(function (Buffer){(function (){
(function() {
  //...........................................................................................................
  // { equals, }               = require 'cnd'
  var CHECKS, assign, jr, js_type_of, jsidentifier_pattern, xrpr,
    modulo = function(a, b) { return (+a % (b = +b) + b) % b; };

  ({assign, jr, xrpr, js_type_of} = require('./helpers'));

  CHECKS = require('./checks');

  /* thx to
    https://github.com/mathiasbynens/mothereff.in/blob/master/js-variables/eff.js
    https://mathiasbynens.be/notes/javascript-identifiers-es6
  */
  // jsidentifier_pattern      = /^(?:[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B4\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D])(?:[\$0-9A-Z_a-z\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B4\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FD5\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AD\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF])*$/
  jsidentifier_pattern = /^(?:[$_]|\p{ID_Start})(?:[$_\u{200c}\u{200d}]|\p{ID_Continue})*$/u;

  //===========================================================================================================
  // XML Names, IDs
  //-----------------------------------------------------------------------------------------------------------
  /*

  * https://www.w3.org/TR/xml/#NT-Name
  * Observe that in HTML5 (but not earlier versions), most restrictions on ID values have been removed; to
    quote: "There are no other restrictions on what form an ID can take; in particular, IDs can consist of
    just digits, start with a digit, start with an underscore, consist of just punctuation, etc."

  [4]     NameStartChar    ::=    ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
  [4a]    NameChar     ::=    NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
  [5]     Name     ::=    NameStartChar (NameChar)*

   */
  //===========================================================================================================
  // OTF Glyph Names
  //-----------------------------------------------------------------------------------------------------------
  /*

  From https://adobe-type-tools.github.io/afdko/OpenTypeFeatureFileSpecification.html#2.f.i

  > A glyph name may be up to 63 characters in length, must be entirely comprised of characters from the
  > following set:
  >
  > ```
  > ABCDEFGHIJKLMNOPQRSTUVWXYZ
  > abcdefghijklmnopqrstuvwxyz
  > 0123456789
  > .  # period
  > _  # underscore
  > ```
  >
  > and must not start with a digit or period. The only exception is the special character “.notdef”.
  >
  > “twocents”, “a1”, and “_” are valid glyph names. “2cents” and “.twocents” are “not.

  */
  //===========================================================================================================
  // TYPE DECLARATIONS
  //-----------------------------------------------------------------------------------------------------------
  this.declare_types = function() {
    /* NOTE to be called as `( require './declarations' ).declare_types.apply instance` */
    this.declare('null', (x) => {
      return x === null;
    });
    this.declare('undefined', (x) => {
      return x === void 0;
    });
    //.........................................................................................................
    this.declare('sad', (x) => {
      return CHECKS.is_sad(x);
    });
    this.declare('happy', (x) => {
      return CHECKS.is_happy(x);
    });
    this.declare('saddened', (x) => {
      return CHECKS.is_saddened(x);
    });
    this.declare('symbol', (x) => {
      return typeof x === 'symbol';
    });
    //.........................................................................................................
    this.declare('boolean', {
      tests: {
        "x is true or false": (x) => {
          return (x === true) || (x === false);
        }
      },
      casts: {
        float: (x) => {
          if (x) {
            return 1;
          } else {
            return 0;
          }
        }
      }
    });
    //.........................................................................................................
    this.declare('nan', (x) => {
      return Number.isNaN(x);
    });
    this.declare('finite', (x) => {
      return Number.isFinite(x);
    });
    this./* TAINT make sure no non-numbers slip through */declare('integer', (x) => {
      return Number.isInteger(x);
    });
    this./* TAINT make sure no non-numbers slip through */declare('safeinteger', (x) => {
      return Number.isSafeInteger(x);
    });
    //.........................................................................................................
    /* FTTB we are retaining `number` as a less-preferred synonym for `float`; in the future, `number` may
     be removed because it conflicts with JS usage (where it includes `NaN` and `+/-Infinity`) and, moreover,
     is not truthful (because it is a poor representation of what the modern understanding of 'number' in the
     mathematical sense would imply). */
    /* NOTE removed in v8: `@specs.number = @specs.float` */
    this./* TAINT make sure no non-numbers slip through */declare('number', (x) => {
      return false; // throw new Error "^intertype@84744^ type 'number' is deprecated"
    });
    this.declare('float', {
      tests: (x) => {
        return Number.isFinite(x);
      },
      casts: {
        boolean: (x) => {
          if (x === 0) {
            return false;
          } else {
            return true;
          }
        },
        integer: (x) => {
          return Math.round(x);
        }
      }
    });
    //.........................................................................................................
    this.declare('frozen', (x) => {
      return Object.isFrozen(x);
    });
    this.declare('sealed', (x) => {
      return Object.isSealed(x);
    });
    this.declare('extensible', (x) => {
      return Object.isExtensible(x);
    });
    //.........................................................................................................
    this.declare('numeric', (x) => {
      return (js_type_of(x)) === 'number';
    });
    this.declare('function', (x) => {
      return (js_type_of(x)) === 'function';
    });
    this.declare('asyncfunction', (x) => {
      return (js_type_of(x)) === 'asyncfunction';
    });
    this.declare('generatorfunction', (x) => {
      return (js_type_of(x)) === 'generatorfunction';
    });
    this.declare('asyncgeneratorfunction', (x) => {
      return (js_type_of(x)) === 'asyncgeneratorfunction';
    });
    this.declare('asyncgenerator', (x) => {
      return (js_type_of(x)) === 'asyncgenerator';
    });
    this.declare('generator', (x) => {
      return (js_type_of(x)) === 'generator';
    });
    this.declare('date', (x) => {
      return (js_type_of(x)) === 'date';
    });
    this.declare('listiterator', (x) => {
      return (js_type_of(x)) === 'arrayiterator';
    });
    this.declare('textiterator', (x) => {
      return (js_type_of(x)) === 'stringiterator';
    });
    this.declare('setiterator', (x) => {
      return (js_type_of(x)) === 'setiterator';
    });
    this.declare('mapiterator', (x) => {
      return (js_type_of(x)) === 'mapiterator';
    });
    this.declare('callable', (x) => {
      var ref;
      return (ref = this.type_of(x)) === 'function' || ref === 'asyncfunction' || ref === 'generatorfunction';
    });
    this.declare('promise', (x) => {
      return (this.isa.nativepromise(x)) || (this.isa.thenable(x));
    });
    this.declare('nativepromise', (x) => {
      return x instanceof Promise;
    });
    this.declare('thenable', (x) => {
      return (this.type_of(x != null ? x.then : void 0)) === 'function';
    });
    this.declare('immediate', function(x) {
      return !this.isa.promise(x);
    });
    //.........................................................................................................
    this.declare('truthy', (x) => {
      return !!x;
    });
    this.declare('falsy', (x) => {
      return !x;
    });
    this.declare('true', (x) => {
      return x === true;
    });
    this.declare('false', (x) => {
      return x === false;
    });
    this.declare('unset', (x) => {
      return x == null;
    });
    this.declare('notunset', (x) => {
      return x != null;
    });
    //.........................................................................................................
    this.declare('even', (x) => {
      return (this.isa.safeinteger(x)) && (modulo(x, 2)) === 0;
    });
    this.declare('odd', (x) => {
      return (this.isa.safeinteger(x)) && (modulo(x, 2)) === 1;
    });
    this.declare('cardinal', function(x) {
      return (this.isa.safeinteger(x)) && (this.isa.nonnegative(x));
    });
    this.declare('nonnegative', (x) => {
      return (this.isa.infloat(x)) && (x >= 0);
    });
    this.declare('positive', (x) => {
      return (this.isa.infloat(x)) && (x > 0);
    });
    this.declare('positive_float', (x) => {
      return (this.isa.float(x)) && (x > 0);
    });
    this.declare('positive_integer', (x) => {
      return (this.isa.integer(x)) && (x > 0);
    });
    this.declare('negative_integer', (x) => {
      return (this.isa.integer(x)) && (x < 0);
    });
    this.declare('zero', (x) => {
      return x === 0;
    });
    this.declare('infinity', (x) => {
      return (x === +2e308) || (x === -2e308);
    });
    this.declare('infloat', (x) => {
      return (this.isa.float(x)) || (x === 2e308) || (x === -2e308);
    });
    this.declare('nonpositive', (x) => {
      return (this.isa.infloat(x)) && (x <= 0);
    });
    this.declare('negative', (x) => {
      return (this.isa.infloat(x)) && (x < 0);
    });
    this.declare('negative_float', (x) => {
      return (this.isa.float(x)) && (x < 0);
    });
    this.declare('proper_fraction', (x) => {
      return (this.isa.float(x)) && ((0 <= x && x <= 1));
    });
    //.........................................................................................................
    this.declare('empty', function(x) {
      return (this.has_size(x)) && (this.size_of(x)) === 0;
    });
    this.declare('singular', function(x) {
      return (this.has_size(x)) && (this.size_of(x)) === 1;
    });
    this.declare('nonempty', function(x) {
      return (this.has_size(x)) && (this.size_of(x)) > 0;
    });
    this.declare('plural', function(x) {
      return (this.has_size(x)) && (this.size_of(x)) > 1;
    });
    this.declare('blank_text', function(x) {
      return (this.isa.text(x)) && ((x.match(/^\s*$/us)) != null);
    });
    this.declare('nonblank_text', function(x) {
      return (this.isa.text(x)) && ((x.match(/^\s*$/us)) == null);
    });
    this.declare('chr', function(x) {
      return (this.isa.text(x)) && ((x.match(/^.$/us)) != null);
    });
    this.declare('nonempty_text', function(x) {
      return (this.isa.text(x)) && (this.isa.nonempty(x));
    });
    this.declare('nonempty_list', function(x) {
      return (this.isa.list(x)) && (this.isa.nonempty(x));
    });
    this.declare('nonempty_object', function(x) {
      return (this.isa.object(x)) && (this.isa.nonempty(x));
    });
    this.declare('nonempty_set', function(x) {
      return (this.isa.set(x)) && (this.isa.nonempty(x));
    });
    this.declare('nonempty_map', function(x) {
      return (this.isa.map(x)) && (this.isa.nonempty(x));
    });
    this.declare('empty_text', function(x) {
      return (this.isa.text(x)) && (this.isa.empty(x));
    });
    this.declare('empty_list', function(x) {
      return (this.isa.list(x)) && (this.isa.empty(x));
    });
    this.declare('empty_object', function(x) {
      return (this.isa.object(x)) && (this.isa.empty(x));
    });
    this.declare('empty_set', function(x) {
      return (this.isa.set(x)) && (this.isa.empty(x));
    });
    this.declare('empty_map', function(x) {
      return (this.isa.map(x)) && (this.isa.empty(x));
    });
    // is_given                  = ( x ) -> not [ null, undefined, NaN, '', ].includes x
    //.........................................................................................................
    this.declare('buffer', {
      size: 'length'
    }, (x) => {
      return Buffer.isBuffer(x);
    });
    this.declare('arraybuffer', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'arraybuffer';
    });
    this.declare('int8array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'int8array';
    });
    this.declare('uint8array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'uint8array';
    });
    this.declare('uint8clampedarray', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'uint8clampedarray';
    });
    this.declare('int16array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'int16array';
    });
    this.declare('uint16array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'uint16array';
    });
    this.declare('int32array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'int32array';
    });
    this.declare('uint32array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'uint32array';
    });
    this.declare('float32array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'float32array';
    });
    this.declare('float64array', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'float64array';
    });
    this.declare('list', {
      size: 'length'
    }, (x) => {
      return (js_type_of(x)) === 'array';
    });
    this.declare('set', {
      size: 'size'
    }, function(x) {
      return (js_type_of(x)) === 'set';
    });
    this.declare('map', {
      size: 'size'
    }, function(x) {
      return (js_type_of(x)) === 'map';
    });
    this.declare('weakmap', function(x) {
      return (js_type_of(x)) === 'weakmap';
    });
    this.declare('weakset', function(x) {
      return (js_type_of(x)) === 'weakset';
    });
    this.declare('error', function(x) {
      return (js_type_of(x)) === 'error';
    });
    this.declare('regex', function(x) {
      return (js_type_of(x)) === 'regexp';
    });
    //.........................................................................................................
    this.declare('object', {
      tests: (x) => {
        return (js_type_of(x)) === 'object';
      },
      size: (x) => {
        return (Object.keys(x)).length;
      }
    });
    //.........................................................................................................
    this.declare('global', {
      tests: (x) => {
        return (js_type_of(x)) === 'global';
      },
      size: (x) => {
        return (Object.keys(x)).length;
      }
    });
    //.........................................................................................................
    this.declare('text', {
      tests: (x) => {
        return (js_type_of(x)) === 'string';
      },
      size: function(x, selector = 'codeunits') {
        var ref;
        switch (selector) {
          case 'codepoints':
            return (Array.from(x)).length;
          case 'codeunits':
            return x.length;
          case 'bytes':
            return Buffer.byteLength(x, (ref = typeof settings !== "undefined" && settings !== null ? settings['encoding'] : void 0) != null ? ref : 'utf-8');
          default:
            throw new Error(`unknown counting selector ${rpr(selector)}`);
        }
      }
    });
    //.........................................................................................................
    this.declare('list_of', {
      tests: {
        "x is a list": (type, x, ...xP) => {
          return this.isa.list(x);
        },
        /* TAINT should check for `@isa.type type` */
        "type is nonempty_text": (type, x, ...xP) => {
          return this.isa.nonempty_text(type);
        },
        "all elements pass test": (type, x, ...xP) => {
          return x.every((xx) => {
            return this.isa(type, xx, ...xP);
          });
        }
      }
    });
    //.........................................................................................................
    this.declare('object_of', {
      tests: {
        "x is a object": (type, x, ...xP) => {
          return this.isa.object(x);
        },
        /* TAINT should check for `@isa.type type` */
        "type is nonempty_text": (type, x, ...xP) => {
          return this.isa.nonempty_text(type);
        },
        "all elements pass test": (type, x, ...xP) => {
          var _, xx;
          for (_ in x) {
            xx = x[_];
            if (!this.isa(type, xx, ...xP)) {
              return false;
            }
          }
          return true;
        }
      }
    });
    //.........................................................................................................
    this.declare('jsidentifier', {
      tests: (x) => {
        return (this.isa.text(x)) && jsidentifier_pattern.test(x);
      }
    });
    //.........................................................................................................
    this.declare('int2text', {
      tests: (x) => {
        return (this.isa.text(x)) && ((x.match(/^[01]+$/)) != null);
      },
      casts: {
        float: (x) => {
          return parseInt(x, 2);
        }
      }
    });
    //.........................................................................................................
    this.declare('int10text', {
      tests: (x) => {
        return (this.isa.text(x)) && ((x.match(/^[0-9]+$/)) != null);
      },
      casts: {
        float: (x) => {
          return parseInt(x, 10);
        }
      }
    });
    //.........................................................................................................
    this.declare('int16text', {
      tests: (x) => {
        return (this.isa.text(x)) && ((x.match(/^[0-9a-fA-F]+$/)) != null);
      },
      casts: {
        float: (x) => {
          return parseInt(x, 16);
        },
        int2text: (x) => {
          return (parseInt(x, 16)).toString(2);
        }
      }
    });
    //.........................................................................................................
    this./* TAINT could use `cast()` API */declare('int32', function(x) {
      return (this.isa.integer(x)) && ((-2147483648 <= x && x <= 2147483647));
    });
    //.........................................................................................................
    this.declare('vnr', function(x) {
      /* A vectorial number (VNR) is a non-empty array of numbers, including infinity. */
      return (this.isa_list_of.infloat(x)) && (x.length > 0);
    });
    //.........................................................................................................
    return this.declare('fs_stats', {
      tests: {
        'x is an object': function(x) {
          return this.isa.object(x);
        },
        'x.size is a cardinal': function(x) {
          return this.isa.cardinal(x.size);
        },
        'x.atimeMs is a float': function(x) {
          return this.isa.float(x.atimeMs);
        },
        'x.atime is a date': function(x) {
          return this.isa.date(x.atime);
        }
      }
    });
  };

  //===========================================================================================================
  // TYPE DECLARATIONS
  //-----------------------------------------------------------------------------------------------------------
  this.declare_checks = function() {
    var FS, PATH;
    PATH = require('path');
    FS = require('fs');
    //.........................................................................................................
    /* NOTE: will throw error unless path exists, error is implicitly caught, represents sad path */
    this.declare_check('fso_exists', function(path, stats = null) {
      return FS.statSync(path);
    });
    // try ( stats ? FS.statSync path ) catch error then error
    //.........................................................................................................
    this.declare_check('is_file', function(path, stats = null) {
      var bad;
      if (this.is_sad((bad = stats = this.check.fso_exists(path, stats)))) {
        return bad;
      }
      if (stats.isFile()) {
        return stats;
      }
      return this.sadden(`not a file: ${path}`);
    });
    //.........................................................................................................
    return this.declare_check('is_json_file', function(path) {
      var error;
      try {
        return JSON.parse(FS.readFileSync(path));
      } catch (error1) {
        error = error1;
        return error;
      }
    });
  };

  // #.........................................................................................................
// @declare_check 'equals', ( a, P... ) ->
//   for b in P
//     return CHECKS.sad unless equals a, b
//   return true
/* not supported until we figure out how to do it in strict mode: */
// @declare 'arguments',                     ( x ) -> ( js_type_of x ) is 'arguments'

  // Array.isArray
// ArrayBuffer.isView
// Atomics.isLockFree
// Buffer.isBuffer
// Buffer.isEncoding
// constructor.is
// constructor.isExtensible
// constructor.isFrozen
// constructor.isSealed
// Number.isFinite
// Number.isInteger
// Number.isNaN
// Number.isSafeInteger
// Object.is
// Object.isExtensible
// Object.isFrozen
// Object.isSealed
// Reflect.isExtensible
// root.isFinite
// root.isNaN
// Symbol.isConcatSpreadable

}).call(this);


}).call(this)}).call(this,require("buffer").Buffer)

},{"./checks":37,"./helpers":40,"buffer":4,"fs":3,"path":23}],39:[function(require,module,exports){
(function (Buffer){(function (){
(function() {
  'use strict';
  var assign, constructor_of_generators, copy_if_original, isa_copy, jr, js_type_of, rpr, xrpr,
    indexOf = [].indexOf;

  //###########################################################################################################
  ({assign, jr, rpr, xrpr, js_type_of} = require('./helpers'));

  isa_copy = Symbol('isa_copy');

  constructor_of_generators = ((function*() {
    return (yield 42);
  })()).constructor;

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT make catalog of all 'deep JS' names that must never be used as types, b/c e.g a type 'bind'
  would shadow native `f.bind()` */
  this.illegal_types = ['bind', 'toString', 'valueOf'];

  //-----------------------------------------------------------------------------------------------------------
  copy_if_original = function(x) {
    var R;
    if (x[isa_copy]) {
      return x;
    }
    R = assign({}, x);
    R[isa_copy] = true;
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._satisfies_all_aspects = function(type, ...xP) {
    if ((this._get_unsatisfied_aspect(type, ...xP)) == null) {
      return true;
    }
    return false;
  };

  //-----------------------------------------------------------------------------------------------------------
  this._get_unsatisfied_aspect = function(type, ...xP) {
    var aspect, factual_type, ref, spec, test;
    /* Check with `type_of()` if type not in spec: */
    if ((spec = this.specs[type]) == null) {
      if ((factual_type = this.type_of(...xP)) === type) {
        return null;
      }
      return `${rpr(type)} is a known type`;
    }
    ref = spec.tests;
    /* Check all constraints in spec: */
    for (aspect in ref) {
      test = ref[aspect];
      if (!test.apply(this, xP)) {
        return aspect;
      }
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.type_of = function(x) {
    var R, arity, c, tagname;
    if ((arity = arguments.length) !== 1) {
      throw new Error(`^7746^ expected 1 argument, got ${arity}`);
    }
    if (x === null) {
      return 'null';
    }
    if (x === void 0) {
      return 'undefined';
    }
    if ((x === 2e308) || (x === -2e308)) {
      return 'infinity';
    }
    if ((x === true) || (x === false)) {
      return 'boolean';
    }
    if (Number.isNaN(x)) {
      return 'nan';
    }
    if (Buffer.isBuffer(x)) {
      return 'buffer';
    }
    //.........................................................................................................
    if (((tagname = x[Symbol.toStringTag]) != null) && (typeof tagname) === 'string') {
      if (tagname === 'Array Iterator') {
        return 'arrayiterator';
      }
      if (tagname === 'String Iterator') {
        return 'stringiterator';
      }
      if (tagname === 'Map Iterator') {
        return 'mapiterator';
      }
      if (tagname === 'Set Iterator') {
        return 'setiterator';
      }
      return tagname.toLowerCase();
    }
    if ((c = x.constructor) === void 0) {
      //.........................................................................................................
      /* Domenic Denicola Device, see https://stackoverflow.com/a/30560581 */
      return 'nullobject';
    }
    if ((typeof c) !== 'function') {
      return 'object';
    }
    if ((R = c.name.toLowerCase()) === '') {
      if (x.constructor === constructor_of_generators) {
        return 'generator';
      }
      /* NOTE: throw error since this should never happen */
      return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase();
    }
    if ((typeof x === 'object') && (R === 'boolean' || R === 'number' || R === 'string')) {
//.........................................................................................................
/* Mark Miller Device */      return 'wrapper';
    }
    if (R === 'number') {
      return 'float';
    }
    if (R === 'regexp') {
      return 'regex';
    }
    if (R === 'string') {
      return 'text';
    }
    if (R === 'array') {
      return 'list';
    }
    if (R === 'function' && x.toString().startsWith('class ')) {
      /* thx to https://stackoverflow.com/a/29094209 */
      /* TAINT may produce an arbitrarily long throwaway string */
      return 'class';
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.types_of = function(...xP) {
    var R, aspect, ok, ref, ref1, spec, test, type;
    R = [];
    ref = this.specs;
    for (type in ref) {
      spec = ref[type];
      ok = true;
      ref1 = spec.tests;
      for (aspect in ref1) {
        test = ref1[aspect];
        if (!test.apply(this, xP)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        R.push(type);
      }
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.declare = function(...P)/* type, spec?, test? */ {
    var arity;
    switch (arity = P.length) {
      case 1:
        return this._declare_1(...P);
      case 2:
        return this._declare_2(...P);
      case 3:
        return this._declare_3(...P);
    }
    throw new Error(`µ6746 expected between 1 and 3 arguments, got ${arity}`);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._declare_1 = function(spec) {
    var T;
    if ((T = js_type_of(spec)) !== 'object') {
      throw new Error(`µ6869 expected an object for spec, got a ${T}`);
    }
    //.........................................................................................................
    if ((T = js_type_of(spec.type)) !== 'string') {
      throw new Error(`µ6992 expected a text for spec.type, got a ${T}`);
    }
    //.........................................................................................................
    switch ((T = js_type_of(spec.tests))) {
      case 'function':
        spec.tests = {
          main: spec.tests
        };
        break;
      case 'object':
        null;
        break;
      default:
        throw new Error(`µ7115 expected an object for spec.tests, got a ${T}`);
    }
    //.........................................................................................................
    return this._declare(spec);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._declare_2 = function(type, spec_or_test) {
    var T, spec;
    switch (T = js_type_of(spec_or_test)) {
      //.......................................................................................................
      case 'function':
        return this._declare_1({
          type,
          tests: {
            main: spec_or_test
          }
        });
      //.......................................................................................................
      case 'asyncfunction':
        throw "µ7238 asynchronous functions not yet supported";
    }
    //.........................................................................................................
    if (T !== 'object') {
      throw new Error(`µ7361 expected an object, got a ${T} for spec`);
    }
    //.........................................................................................................
    if ((spec_or_test.type != null) && (!spec_or_test.type === type)) {
      throw new Error(`µ7484 type declarations ${rpr(type)} and ${rpr(spec_or_test.type)} do not match`);
    }
    //.........................................................................................................
    spec = copy_if_original(spec_or_test);
    spec.type = type;
    return this._declare_1(spec);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._declare_3 = function(type, spec, test) {
    var T;
    if ((T = js_type_of(spec)) !== 'object') {
      throw new Error(`µ7607 expected an object, got a ${T} for spec`);
    }
    //.........................................................................................................
    if ((T = js_type_of(test)) !== 'function') {
      throw new Error(`µ7730 expected a function for test, got a ${T}`);
    }
    //.........................................................................................................
    if (spec.tests != null) {
      throw new Error("µ7853 spec cannot have tests when tests are passed as argument");
    }
    //.........................................................................................................
    spec = copy_if_original(spec);
    spec.tests = {
      main: test
    };
    return this._declare_2(type, spec);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._declare = function(spec) {
    var type;
    spec = copy_if_original(spec);
    delete spec[isa_copy];
    ({type} = spec);
    spec.type = type;
    //.........................................................................................................
    if (indexOf.call(this.illegal_types, type) >= 0) {
      throw new Error(`µ7976 ${rpr(type)} is not a legal type name`);
    }
    //.........................................................................................................
    if (this.specs[type] != null) {
      throw new Error(`µ8099 type ${rpr(type)} already declared`);
    }
    //.........................................................................................................
    this.specs[type] = spec;
    this.isa[type] = (...P) => {
      return this.isa(type, ...P);
    };
    // @validate[ type ]    = ( P... ) => @validate type, P...
    spec.size = this._sizeof_method_from_spec(type, spec);
    //.........................................................................................................
    return null;
  };

}).call(this);


}).call(this)}).call(this,{"isBuffer":require("../../../../../../../../.local/share/pnpm/global/5/.pnpm/is-buffer@1.1.6/node_modules/is-buffer/index.js")})

},{"../../../../../../../../.local/share/pnpm/global/5/.pnpm/is-buffer@1.1.6/node_modules/is-buffer/index.js":19,"./helpers":40}],40:[function(require,module,exports){
(function() {
  'use strict';
  var LOUPE, inspect, rpr,
    indexOf = [].indexOf;

  //-----------------------------------------------------------------------------------------------------------
  ({inspect} = require('util'));

  this.assign = Object.assign;

  // @jr           = JSON.stringify
  LOUPE = require('../deps/loupe.js');

  this.rpr = rpr = (x) => {
    return LOUPE.inspect(x, {
      customInspect: false
    });
  };

  this.xrpr = function(x) {
    return (rpr(x)).slice(0, 1025);
  };

  //===========================================================================================================
  // TYPE_OF FLAVORS
  //-----------------------------------------------------------------------------------------------------------
  this.domenic_denicola_device = (x) => {
    var ref, ref1;
    return (ref = x != null ? (ref1 = x.constructor) != null ? ref1.name : void 0 : void 0) != null ? ref : './.';
  };

  this.mark_miller_device = (x) => {
    return (Object.prototype.toString.call(x)).slice(8, -1);
  };

  this.mark_miller_device_2 = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  this.js_type_of = (x) => {
    return ((Object.prototype.toString.call(x)).slice(8, -1)).toLowerCase().replace(/\s+/g, '');
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  this.get_rprs_of_tprs = function(tprs) {
    /* `tprs: test parameters, i.e. additional arguments to type tester, as in `multiple_of x, 4` */
    var rpr_of_tprs, srpr_of_tprs;
    rpr_of_tprs = (function() {
      switch (tprs.length) {
        case 0:
          return '';
        case 1:
          return `${rpr(tprs[0])}`;
        default:
          return `${rpr(tprs)}`;
      }
    })();
    srpr_of_tprs = (function() {
      switch (rpr_of_tprs.length) {
        case 0:
          return '';
        default:
          return ' ' + rpr_of_tprs;
      }
    })();
    return {rpr_of_tprs, srpr_of_tprs};
  };

  //-----------------------------------------------------------------------------------------------------------
  this.intersection_of = function(a, b) {
    var x;
    a = [...a].sort();
    b = [...b].sort();
    return ((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = a.length; i < len; i++) {
        x = a[i];
        if (indexOf.call(b, x) >= 0) {
          results.push(x);
        }
      }
      return results;
    })()).sort();
  };

}).call(this);


},{"../deps/loupe.js":36,"util":27}],41:[function(require,module,exports){
(function() {
  'use strict';
  var HELPERS, Multimix, assign, cast, check, declarations, get_rprs_of_tprs, isa, isa_list_of, isa_object_of, isa_optional, jk_equals, jr, js_type_of, rpr, sad, validate, validate_list_of, validate_object_of, validate_optional, xrpr;

  //###########################################################################################################
  Multimix = require('multimix');

  //...........................................................................................................
  HELPERS = require('./helpers');

  ({assign, jr, rpr, xrpr, get_rprs_of_tprs, js_type_of} = HELPERS);

  //...........................................................................................................
  declarations = require('./declarations');

  sad = (require('./checks')).sad;

  jk_equals = require('../deps/jkroso-equals');

  //-----------------------------------------------------------------------------------------------------------
  isa = function(type, ...xP) {
    return this._satisfies_all_aspects(type, ...xP);
  };

  isa_list_of = function(type, ...xP) {
    return this.isa.list_of(type, ...xP);
  };

  isa_object_of = function(type, ...xP) {
    return this.isa.object_of(type, ...xP);
  };

  validate_list_of = function(type, ...xP) {
    return this.validate.list_of(type, ...xP);
  };

  validate_object_of = function(type, ...xP) {
    return this.validate.object_of(type, ...xP);
  };

  isa_optional = function(type, ...xP) {
    return (xP[0] == null) || this._satisfies_all_aspects(type, ...xP);
  };

  validate_optional = function(type, ...xP) {
    return (xP[0] == null) || this.validate(type, ...xP);
  };

  //-----------------------------------------------------------------------------------------------------------
  cast = function(type_a, type_b, x, ...xP) {
    var casts, converter;
    this.validate(type_a, x, ...xP);
    if (type_a === type_b) {
      return x;
    }
    if (this.isa(type_b, x, ...xP)) {
      return x;
    }
    if ((casts = this.specs[type_a].casts) != null) {
      if ((converter = casts[type_b]) != null) {
        return converter.call(this, x, ...xP);
      }
    }
    if (type_b === 'text'/* TAINT use better method like util.inspect */) {
      return `${x}`;
    }
    throw new Error(`^intertype/cast@1234^ unable to cast a ${type_a} as ${type_b}`);
  };

  //-----------------------------------------------------------------------------------------------------------
  check = function(type, x, ...xP) {
    var error;
    if (this.specs[type] != null) {
      if (this.isa(type, x, ...xP)) {
        return true;
      } else {
        return sad;
      }
    }
    if ((check = this.checks[type]) == null) {
      throw new Error(`^intertype/check@1345^ unknown type or check ${rpr(type)}`);
    }
    try {
      return check.call(this, x, ...xP);
    } catch (error1) {
      error = error1;
      return error;
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  validate = function(type, ...xP) {
    var P, aspect, message, rpr_of_tprs, srpr_of_tprs, x;
    if ((aspect = this._get_unsatisfied_aspect(type, ...xP)) == null) {
      return true;
    }
    [x, ...P] = xP;
    ({rpr_of_tprs, srpr_of_tprs} = get_rprs_of_tprs(P));
    message = aspect === 'main' ? `^intertype/validate@1456^ not a valid ${type}: ${xrpr(x)}${srpr_of_tprs}` : `^intertype/validate@1567^ not a valid ${type} (violates ${rpr(aspect)}): ${xrpr(x)}${srpr_of_tprs}`;
    throw new Error(message);
  };

  //===========================================================================================================
  this.Intertype = (function() {
    class Intertype extends Multimix {
      //---------------------------------------------------------------------------------------------------------
      constructor(target = null) {
        super();
        //.......................................................................................................
        /* TAINT bug in MultiMix, should be possible to declare methods in class, not the constructor,
           and still get a bound version with `export()`; declaring them here FTTB */
        //.......................................................................................................
        this.sad = sad;
        this.specs = {};
        this.checks = {};
        this.isa = Multimix.get_keymethod_proxy(this, isa);
        this.isa_optional = Multimix.get_keymethod_proxy(this, isa_optional);
        this.isa_list_of = Multimix.get_keymethod_proxy(this, isa_list_of);
        this.isa_object_of = Multimix.get_keymethod_proxy(this, isa_object_of);
        this.cast = Multimix.get_keymethod_proxy(this, cast);
        this.validate = Multimix.get_keymethod_proxy(this, validate);
        this.validate_optional = Multimix.get_keymethod_proxy(this, validate_optional);
        this.validate_list_of = Multimix.get_keymethod_proxy(this, validate_list_of);
        this.validate_object_of = Multimix.get_keymethod_proxy(this, validate_object_of);
        this.check = Multimix.get_keymethod_proxy(this, check);
        this.nowait = function(x) {
          this.validate.immediate(x);
          return x;
        };
        this._helpers = HELPERS;
        declarations.declare_types.apply(this);
        declarations.declare_checks.apply(this);
        if (target != null) {
          this.export(target);
        }
      }

      //---------------------------------------------------------------------------------------------------------
      equals(a, ...P) {
        var arity, b, i, len, type_of_a;
        if ((arity = arguments.length) < 2) {
          throw new Error(`^intertype/equals@3489^ expected at least 2 arguments, got ${arity}`);
        }
        type_of_a = this.type_of(a);
        for (i = 0, len = P.length; i < len; i++) {
          b = P[i];
          if (type_of_a !== this.type_of(b)) {
            return false;
          }
          if ((type_of_a === 'set' || type_of_a === 'map') && this.equals([...a], [...b])) {
            return true;
          }
          if (!jk_equals(a, b)) {
            /* TAINT this call involves its own typechecking code and thus may mysteriously fail */
            return false;
          }
        }
        return true;
      }

    };

    // @extend   object_with_class_properties
    Intertype.include(require('./sizing'));

    Intertype.include(require('./declaring'));

    Intertype.include(require('./checks'));

    return Intertype;

  }).call(this);

}).call(this);


},{"../deps/jkroso-equals":34,"./checks":37,"./declarations":38,"./declaring":39,"./helpers":40,"./sizing":42,"multimix":44}],42:[function(require,module,exports){
(function() {
  'use strict';
  var assign, jr, js_type_of, xrpr;

  //###########################################################################################################
  ({assign, jr, xrpr, js_type_of} = require('./helpers'));

  //===========================================================================================================
  // OBJECT SIZES
  //-----------------------------------------------------------------------------------------------------------
  this._sizeof_method_from_spec = function(type, spec) {
    return ((s) => {
      var T;
      if (s == null) {
        return null;
      }
      switch (T = js_type_of(s)) {
        case 'string':
          return function(x) {
            return x[s];
          };
        case 'function':
          return s/* TAINT disallows async funtions */;
        case 'number':
          return function() {
            return s/* TAINT allows NaN, Infinity */;
          };
      }
      throw new Error(`µ30988 expected null, a text or a function for size of ${type}, got a ${T}`);
    })(spec.size);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.size_of = function(x, ...P) {
    /* The `size_of()` method uses a per-type configurable methodology to return the size of a given value;
     such methodology may permit or necessitate passing additional arguments (such as `size_of text`, which
     comes in several flavors depending on whether bytes or codepoints are to be counted). As such, it is a
     model for how to implement Go-like method dispatching. */
    var getter, ref, type;
    type = this.type_of(x);
    if (!(this.isa.function((getter = (ref = this.specs[type]) != null ? ref.size : void 0)))) {
      throw new Error(`µ88793 unable to get size of a ${type}`);
    }
    return getter(x, ...P);
  };

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT faulty implementation:
   * does not use size_of but length
   * does not accept additional arguments as needed for texts
   * risks to break codepoints apart
    */
  this.first_of = function(collection) {
    return collection[0];
  };

  this.last_of = function(collection) {
    return collection[collection.length - 1];
  };

  //-----------------------------------------------------------------------------------------------------------
  this.arity_of = function(x) {
    var type;
    if ((type = this.supertype_of(x)) !== 'callable') {
      throw new Error(`µ88733 expected a callable, got a ${type}`);
    }
    return x.length;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.has_size = function(x) {
    var ref;
    return this.isa.function((ref = this.specs[this.type_of(x)]) != null ? ref.size : void 0);
  };

}).call(this);


},{"./helpers":40}],43:[function(require,module,exports){
(function() {
  'use strict';
  //===========================================================================================================
  // OBJECT PROPERTY CATALOGUING
  //-----------------------------------------------------------------------------------------------------------
  this.keys_of = function(...P) {
    return this.values_of(this.walk_keys_of(...P));
  };

  this.all_keys_of = function(...P) {
    return this.values_of(this.walk_all_keys_of(...P));
  };

  this.all_own_keys_of = function(x) {
    if (x != null) {
      return Object.getOwnPropertyNames(x);
    } else {
      return [];
    }
  };

  this.walk_all_own_keys_of = function*(x) {
    var i, k, len, ref, results;
    ref = this.all_own_keys_of(x);
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      k = ref[i];
      results.push((yield k));
    }
    return results;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.walk_keys_of = function*(x, settings) {
    var defaults, k, results;
    defaults = {
      skip_undefined: true
    };
    settings = {...defaults, ...settings};
    results = [];
    for (k in x) {
      if ((x[k] === void 0) && settings.skip_undefined) {
        /* TAINT should use property descriptors to avoid possible side effects */
        continue;
      }
      results.push((yield k));
    }
    return results;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.walk_all_keys_of = function(x, settings) {
    var defaults;
    defaults = {
      skip_object: true,
      skip_undefined: true
    };
    settings = {...defaults, ...settings};
    return this._walk_all_keys_of(x, new Set(), settings);
  };

  //-----------------------------------------------------------------------------------------------------------
  this._walk_all_keys_of = function*(x, seen, settings) {
    /* TAINT should use property descriptors to avoid possible side effects */
    /* TAINT trying to access `arguments` causes error */
    var error, k, proto, ref, value;
    if ((!settings.skip_object) && x === Object.prototype) {
      return;
    }
    ref = this.walk_all_own_keys_of(x);
    //.........................................................................................................
    for (k of ref) {
      if (seen.has(k)) {
        continue;
      }
      seen.add(k);
      try {
        value = x[k];
      } catch (error1) {
        error = error1;
        continue;
      }
      if ((value === void 0) && settings.skip_undefined) {
        continue;
      }
      if (settings.symbol != null) {
        if (value == null) {
          continue;
        }
        if (!value[settings.symbol]) {
          continue;
        }
      }
      yield k;
    }
    //.........................................................................................................
    if ((proto = Object.getPrototypeOf(x)) != null) {
      return (yield* this._walk_all_keys_of(proto, seen, settings));
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  /* Turn iterators into lists, copy lists: */
  this.values_of = function(x) {
    return [...x];
  };

  //-----------------------------------------------------------------------------------------------------------
  this.has_keys = function(x, ...P) {
    var i, key, len, ref;
    if (x == null) {
      /* Observe that `has_keys()` always considers `undefined` as 'not set' */
      return false;
    }
/* TAINT or throw error */    ref = P.flat(2e308);
    for (i = 0, len = ref.length; i < len; i++) {
      key = ref[i];
      if (x[key] === void 0) {
        /* TAINT should use property descriptors to avoid possible side effects */
        return false;
      }
    }
    return true;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.has_key = function(x, key) {
    return this.has_keys(x, key);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.has_only_keys = function(x, ...P) {
    var keys, probes;
    probes = (P.flat(2e308)).sort();
    keys = (this.values_of(this.keys_of(x))).sort();
    return probes.length = keys.length && probes.every(function(x, idx) {
      return x === keys[idx];
    });
  };

}).call(this);


},{}],44:[function(require,module,exports){
(function() {
  'use strict';
  var Multimix, module_keywords,
    indexOf = [].indexOf;

  //===========================================================================================================
  // MODULE METACLASS provides static methods `@extend()`, `@include()`
  //-----------------------------------------------------------------------------------------------------------
  /* The little dance around the module_keywords variable is to ensure we have callback support when mixins
  extend a class. See https://arcturo.github.io/library/coffeescript/03_classes.html */
  //-----------------------------------------------------------------------------------------------------------
  module_keywords = ['extended', 'included'];

  Multimix = (function() {
    //===========================================================================================================
    class Multimix {
      //---------------------------------------------------------------------------------------------------------
      static extend(object, settings = null) {
        var key, ref, value;
        settings = {...{
            overwrite: true
          }, ...(settings != null ? settings : null)};
        for (key in object) {
          value = object[key];
          if (!(indexOf.call(module_keywords, key) < 0)) {
            continue;
          }
          if ((!settings.overwrite) && ((this.prototype[key] != null) || (this[key] != null))) {
            throw new Error(`^multimix/include@5684 overwrite set to false but name already set: ${JSON.stringify(key)}`);
          }
          this[key] = value;
        }
        if ((ref = object.extended) != null) {
          ref.apply(this);
        }
        return this;
      }

      //---------------------------------------------------------------------------------------------------------
      static include(object, settings = null) {
        var key, ref, value;
        settings = {...{
            overwrite: true
          }, ...(settings != null ? settings : null)};
        for (key in object) {
          value = object[key];
          if (!(indexOf.call(module_keywords, key) < 0)) {
            continue;
          }
          if ((!settings.overwrite) && ((this.prototype[key] != null) || (this[key] != null))) {
            throw new Error(`^multimix/include@5683 overwrite set to false but name already set: ${JSON.stringify(key)}`);
          }
          // Assign properties to the prototype
          this.prototype[key] = value;
        }
        if ((ref = object.included) != null) {
          ref.apply(this);
        }
        return this;
      }

      //---------------------------------------------------------------------------------------------------------
      export(target = null) {
        /* Return an object with methods, bound to the current instance. */
        var R, k, ref, ref1, v;
        R = target != null ? target : {};
        ref = (require('./cataloguing')).walk_all_keys_of(this);
        for (k of ref) {
          v = this[k];
          if ((v != null ? v.bind : void 0) == null) {
            R[k] = v;
          } else if ((ref1 = v[Multimix.isa_keymethod_proxy]) != null ? ref1 : false) {
            R[k] = Multimix.get_keymethod_proxy(this, v);
          } else {
            R[k] = v.bind(this);
          }
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      get_my_prototype() {
        return Object.getPrototypeOf(Object.getPrototypeOf(this));
      }

      //---------------------------------------------------------------------------------------------------------
      new(...P) {
        return new this.constructor(...P);
      }

      //=========================================================================================================
      // KEYMETHOD FACTORY
      //---------------------------------------------------------------------------------------------------------
      static get_keymethod_proxy(bind_target, f) {
        var R;
        R = new Proxy(f.bind(bind_target), {
          get: function(target, key) {
            if (key === 'bind') { // ... other properties ...
              return target[key];
            }
            if ((typeof key) === 'symbol') {
              return target[key];
            }
            return function(...xP) {
              return target(key, ...xP);
            };
          }
        });
        R[Multimix.isa_keymethod_proxy] = true;
        return R;
      }

    };

    //=========================================================================================================
    // @js_type_of = ( x ) -> return ( ( Object::toString.call x ).slice 8, -1 ).toLowerCase()
    Multimix.isa_keymethod_proxy = Symbol('proxy');

    return Multimix;

  }).call(this);

  //###########################################################################################################
  module.exports = Multimix;

}).call(this);


},{"./cataloguing":43}],"mudom":[function(require,module,exports){
(function() {
  'use strict';
  var Dom, INTERTEXT, Text, debug, isa, loupe, misfit, types, validate;

  loupe = require('../loupe.js');

  misfit = Symbol('misfit');

  debug = console.debug;

  ({types, isa, validate} = require('./types'));

  //-----------------------------------------------------------------------------------------------------------
  INTERTEXT = {
    camelize: function(text) {
      /* thx to https://github.com/lodash/lodash/blob/master/camelCase.js */
      var i, idx, ref, word, words;
      words = text.split('-');
      for (idx = i = 1, ref = words.length; i < ref; idx = i += +1) {
        word = words[idx];
        if (word === '') {
          continue;
        }
        words[idx] = word[0].toUpperCase() + word.slice(1);
      }
      return words.join('');
    }
  };

  //===========================================================================================================

  //-----------------------------------------------------------------------------------------------------------
  Text = class Text {
    //---------------------------------------------------------------------------------------------------------
    rpr(x) {
      return loupe.inspect(x);
    }

    _pen1(x) {
      if (isa.text(x)) {
        return x;
      } else {
        return this.rpr(x);
      }
    }

    pen(...P) {
      return (P.map((x) => {
        return this._pen1(x);
      })).join(' ');
    }

    pen_escape(...P) {
      return (P.map((x) => {
        return this._pen_escape1(x);
      })).join(' ');
    }

    log(...P) {
      return console.log(this.pen(...P));
    }

    //---------------------------------------------------------------------------------------------------------
    _pen_escape1(x) {
      if (isa.text(x)) {
        return this._escape(x);
      }
      if (isa.element(x)) {
        return this._escape(x.outerHTML);
      }
      return this.rpr(x);
    }

    //---------------------------------------------------------------------------------------------------------
    _escape(x) {
      return x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

  };

  Dom = (function() {
    //===========================================================================================================

    //-----------------------------------------------------------------------------------------------------------
    class Dom { // extends Multimix
      /* inspired by http://youmightnotneedjquery.com
       and https://blog.garstasio.com/you-dont-need-jquery */
      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      ready(f) {
        // thx to https://stackoverflow.com/a/7053197/7568091
        // function r(f){/in/.test(document.readyState)?setTimeout(r,9,f):f()}
        validate.function(f);
        if (/in/.test(document.readyState)) {
          return setTimeout((() => {
            return this.ready(f);
          }), 9);
        }
        return f();
      }

      //=========================================================================================================
      // WARNINGS, NOTIFICATIONS
      //---------------------------------------------------------------------------------------------------------
      _notify(message) {
        var body, id, message_box, message_p, style;
        id = 'msgbx49573';
        message_box = this.select(`${id}`, null);
        if (message_box === null) {
          body = this.select('body', null);
          /* TAINT body element cannot be found when method is called before document ready, but we could still
               construct element immediately, append it on document ready */
          if (body == null) {
            return;
          }
          style = "background:#18171d;";
          style += "position:fixed;";
          style += "bottom:0mm;";
          style += "border:1mm dashed #e2ff00;";
          style += "padding-left:3mm;";
          style += "padding-right:3mm;";
          style += "padding-bottom:3mm;";
          style += "font-family:sans-serif;";
          style += "font-weight:bold !important;";
          style += "font-size:3mm;";
          style += "color:#e2ff00;";
          style += "width:100%;";
          style += "max-height:30mm;";
          style += "overflow-y:scroll;";
          message_box = this.parse_one(`<div id=${id} style='${style}'></div>`);
          this.append(body, message_box);
        }
        message_p = "<p style='padding-top:3mm;'>";
        message_p += "⚠️&nbsp;<strong>";
        message_p += µ.TEXT.pen_escape(message);
        message_p += "</strong></p>";
        message_p = this.parse_one(message_p);
        this.insert_as_last(message_box, message_p);
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      warn(...P) {
        /* Construct a text message for display in console and in notification box, alongside with a stack trace
           to be shown only in the console, preced by the original arguments as passed into this function,
           meaning that any DOM elements will be expandable links to their visible representations on the HTML
           page. */
        var error, message;
        message = µ.TEXT.pen(...P);
        error = new Error(message);
        console.groupCollapsed(P[0]);
        console.warn(...P);
        console.groupEnd();
        return this._notify(message);
      }

      //=========================================================================================================

      //---------------------------------------------------------------------------------------------------------
      /* NOTE `µ.DOM.select()` to be deprecated in favor of `µ.DOM.select_first()` */
      select(selector, fallback = misfit) {
        return this.select_first(document, selector, fallback);
      }

      select_first(selector, fallback = misfit) {
        return this.select_from(document, selector, fallback);
      }

      select_all(selector) {
        return this.select_all_from(document, selector);
      }

      //---------------------------------------------------------------------------------------------------------
      /* NOTE `µ.DOM.select_from()` to be deprecated in favor of `µ.DOM.select_first_from()` */
      select_from(element, selector, fallback = misfit) {
        return this.select_first_from(element, selector, fallback);
      }

      select_first_from(element, selector, fallback = misfit) {
        var R;
        validate.delement(element);
        validate.nonempty_text(selector);
        if ((R = element.querySelector(selector)) == null) {
          if (fallback === misfit) {
            throw new Error(`^µDOM/select_from@7758^ no such element: ${µ.TEXT.rpr(selector)}`);
          }
          return fallback;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      select_all_from(element, selector) {
        validate.delement(element);
        validate.nonempty_text(selector);
        return element.querySelectorAll(selector);
      }

      // Array.from element.querySelectorAll selector

        //---------------------------------------------------------------------------------------------------------
      select_id(id, fallback = misfit) {
        var R;
        validate.nonempty_text(id);
        if ((R = document.getElementById(id)) == null) {
          if (fallback === misfit) {
            throw new Error(`^µDOM/select_id@7758^ no element with ID: ${µ.TEXT.rpr(id)}`);
          }
          return fallback;
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      matches_selector(element, selector) {
        if (!isa.function(element != null ? element.matches : void 0)) {
          throw new Error(`^µDOM/select_id@77581^ expected element with \`match()\` method, got ${µ.TEXT.rpr(element)}`);
        }
        return element.matches(selector);
      }

      //---------------------------------------------------------------------------------------------------------
      get(element, name) {
        validate.element(element);
        return element.getAttribute(name);
      }

      get_numeric(element, name) {
        return parseFloat(this.get(element, name));
      }

      // When called with two arguments as in `set div, 'bar'`, will set values-less attribute (`<div bar>`)
      set(element, name, value = '') {
        validate.element(element);
        return element.setAttribute(name, value);
      }

      //---------------------------------------------------------------------------------------------------------
      get_classes(element) {
        validate.element(element);
        return element.classList;
      }

      add_class(element, name) {
        validate.element(element);
        return element.classList.add(name);
      }

      has_class(element, name) {
        validate.element(element);
        return element.classList.contains(name);
      }

      remove_class(element, name) {
        validate.element(element);
        return element.classList.remove(name);
      }

      toggle_class(element, name) {
        validate.element(element);
        return element.classList.toggle(name);
      }

      //---------------------------------------------------------------------------------------------------------
      swap_class(element, old_name, new_name) {
        element.classList.remove(old_name);
        return element.classList.add(new_name);
      }

      //---------------------------------------------------------------------------------------------------------
      hide(element) {
        validate.element(element);
        return element.style.display = 'none';
      }

      show(element) {
        validate.element(element);
        return element.style.display = '';
      }

      //---------------------------------------------------------------------------------------------------------
      get_live_styles(element) {
        return getComputedStyle(element);
      }

      /*
      globalThis.get_style = ( element, pseudo_selector, attribute_name ) ->
        unless attribute_name?
          [ pseudo_selector, attribute_name, ] = [ undefined, pseudo_selector, ]
        style = window.getComputedStyle element, pseudo_selector
        return style.getPropertyValue attribute_name
      */
      /* TAINT also use pseudo_selector, see above */
      /* validation done by method */
      /* validation done by method */      get_style_value(element, name) {
        return (getComputedStyle(element))[name];
      }

      get_numeric_style_value(element, name) {
        return parseFloat((getComputedStyle(element))[name]);
      }

      /* thx to https://davidwalsh.name/css-variables-javascript */
      get_prop_value(element, name) {
        return (getComputedStyle(element)).getPropertyValue(name);
      }

      get_numeric_prop_value(element, name) {
        return parseFloat((getComputedStyle(element)).getPropertyValue(name));
      }

      /* thx to https://davidwalsh.name/css-variables-javascript */
      get_global_prop_value(name) {
        return (getComputedStyle(document)).getPropertyValue(name);
      }

      get_numeric_global_prop_value(name) {
        return parseFloat((getComputedStyle(document)).getPropertyValue(name));
      }

      set_global_prop_value(name, value) {
        return document.documentElement.style.setProperty(name, value);
      }

      // #-----------------------------------------------------------------------------------------------------------
      // set_prop_defaults = ->
      //   ### There shoud be a better way to inject styles ###
      //   return null if _set_prop_defaults
      //   # head_dom = µ.DOM.select_first 'head'
      //   # style_txt = """
      //   # <style>
      //   #   * {
      //   #     outline:       2px solid yellow; }
      //   #   </style>
      //   # """
      //   # head_dom.innerHTML = style_txt + head_dom.innerHTML
      //   tophat_dom = µ.DOM.select_first '#tophat'
      //   µ.DOM.insert_before tophat_dom, µ.DOM.parse_one """
      //   <style>
      //     * {
      //       outline:       2px solid yellow; }
      //     :root {
      //       --hstn-slider-track-bgcolor:    lime; }
      //     </style>
      //   """
      //   return null

        //---------------------------------------------------------------------------------------------------------
      set_style_rule(element, name, value) {
        /* see https://developer.mozilla.org/en-US/docs/Web/API/ElementCSSInlineStyle/style */
        validate.element(element);
        validate.nonempty_text(name);
        return element.style[INTERTEXT.camelize(name)] = value;
      }

      //=========================================================================================================
      // ELEMENT CREATION
      //---------------------------------------------------------------------------------------------------------
      parse_one(element_html) {
        var R, length;
        R = this.parse_all(element_html);
        if ((length = R.length) !== 1) {
          throw new Error(`^µDOM/parse_one@7558^ expected HTML for 1 element but got ${length}`);
        }
        return R[0];
      }

      //---------------------------------------------------------------------------------------------------------
      parse_all(html) {
        var R;
        /* TAINT return Array or HTMLCollection? */
        validate.nonempty_text(html);
        R = document.implementation.createHTMLDocument();
        R.body.innerHTML = html;
        return R.body.children;
      }

      //---------------------------------------------------------------------------------------------------------
      new_element(xname, ...P) {
        /* TAINT analyze xname (a la `div#id42.foo.bar`) as done in Intertext.Cupofhtml */
        /* TAINT in some cases using innerHTML, documentFragment may be advantageous */
        var R, attributes, i, k, len, p, text, v;
        R = document.createElement(xname);
        attributes = {};
        text = null;
        for (i = 0, len = P.length; i < len; i++) {
          p = P[i];
          if (isa.text(p)) {
            text = p;
            continue;
          }
          attributes = Object.assign(attributes, p);
        }
        if (text != null) {
          /* TAINT check type? */          R.textContent = text;
        }
        for (k in attributes) {
          v = attributes[k];
          R.setAttribute(k, v);
        }
        return R;
      }

      //---------------------------------------------------------------------------------------------------------
      deep_copy(element) {
        return element.cloneNode(true);
      }

      //=========================================================================================================
      // OUTER, INNER HTML
      //---------------------------------------------------------------------------------------------------------
      get_inner_html(element) {
        validate.element(element);
        return element.innerHTML;
      }

      get_outer_html(element) {
        validate.element(element);
        return element.outerHTML;
      }

      //=========================================================================================================
      // INSERTION
      //---------------------------------------------------------------------------------------------------------
      insert(position, target, x) {
        switch (position) {
          case 'before':
          case 'beforebegin':
            return this.insert_before(target, x);
          case 'as_first':
          case 'afterbegin':
            return this.insert_as_first(target, x);
          case 'as_last':
          case 'beforeend':
            return this.insert_as_last(target, x);
          case 'after':
          case 'afterend':
            return this.insert_after(target, x);
        }
        throw new Error(`^µDOM/insert@7758^ not a valid position: ${µ.TEXT.rpr(position)}`);
      }

      //---------------------------------------------------------------------------------------------------------
      /* NOTE pending practical considerations and benchmarks we will probably remove one of the two sets
       of insertion methods */
      insert_before(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('beforebegin', x);
      }

      insert_as_first(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('afterbegin', x);
      }

      insert_as_last(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('beforeend', x);
      }

      insert_after(target, x) {
        validate.element(target);
        return target.insertAdjacentElement('afterend', x);
      }

      //---------------------------------------------------------------------------------------------------------
      before(target, ...x) {
        validate.element(target);
        return target.before(...x);
      }

      prepend(target, ...x) {
        validate.element(target);
        return target.prepend(...x);
      }

      append(target, ...x) {
        validate.element(target);
        return target.append(...x);
      }

      after(target, ...x) {
        validate.element(target);
        return target.after(...x);
      }

      //=========================================================================================================
      // REMOVAL
      //---------------------------------------------------------------------------------------------------------
      remove(element) {
        /* see http://youmightnotneedjquery.com/#remove */
        validate.element(element);
        return element.parentNode.removeChild(element);
      }

      //=========================================================================================================
      // GEOMETRY
      //---------------------------------------------------------------------------------------------------------
      /* NOTE observe that `DOM.get_offset_top()` and `element.offsetTop` are two different things; terminology
       is confusing here, so consider renaming to avoid `offset` altogether */
      get_offset_top(element) {
        return (this.get_offset(element)).top;
      }

      get_offset_left(element) {
        return (this.get_offset(element)).left;
      }

      //---------------------------------------------------------------------------------------------------------
      get_offset(element) {
        var rectangle;
        /* see http://youmightnotneedjquery.com/#offset */
        validate.element(element);
        rectangle = element.getBoundingClientRect();
        return {
          top: rectangle.top + document.body.scrollTop,
          left: rectangle.left + document.body.scrollLeft
        };
      }

      //---------------------------------------------------------------------------------------------------------
      /* see http://youmightnotneedjquery.com/#get_width */
      get_width(element) {
        return this.get_numeric_style_value(element, 'width');
      }

      get_height(element) {
        return this.get_numeric_style_value(element, 'height');
      }

      //=========================================================================================================
      // EVENTS
      //---------------------------------------------------------------------------------------------------------
      on(element, name, handler) {
        /* TAINT add options */
        /* see http://youmightnotneedjquery.com/#on, http://youmightnotneedjquery.com/#delegate */
        /* Also note the addition of a `passive: false` parameter (as in `html_dom.addEventListener 'wheel', f,
           { passive: false, }`); see https://stackoverflow.com/a/55461632/256361; apparently it is a recently
           introduced feature of browser event processing; see also [JQuery issue #2871 *Add support for passive
           event listeners*](https://github.com/jquery/jquery/issues/2871), open as of Dec 2020 */
        validate.delement(element);
        validate.nonempty_text(name);
        validate.function(handler);
        return element.addEventListener(name, handler, false);
      }

      //---------------------------------------------------------------------------------------------------------
      emit_custom_event(name, options) {
        // thx to https://www.javascripttutorial.net/javascript-dom/javascript-custom-events/
        /* Acc. to https://developer.mozilla.org/en-US/docs/Web/API/Event/Event,
           https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent, allowable fields for `options`
           include `bubbles`, `cancelable`, `composed`, `detail`; the last one may contain arbitrary data and can
           be retrieved as `event.detail`. */
        validate.nonempty_text(name);
        return document.dispatchEvent(new CustomEvent(name, options));
      }

      //=========================================================================================================
      // DRAGGABLES
      //---------------------------------------------------------------------------------------------------------
      make_draggable(element) {
        var id, on_drag_start, on_drop;
        /* thx to http://jsfiddle.net/robertc/kKuqH/
           https://stackoverflow.com/a/6239882/7568091 */
        this._attach_dragover();
        this._prv_draggable_id++;
        id = this._prv_draggable_id;
        this.set(element, 'draggable', true);
        //.......................................................................................................
        this.on(element, 'dragstart', on_drag_start = function(event) {
          var style, x, y;
          style = µ.DOM.get_live_styles(event.target);
          x = (parseInt(style.left, 10)) - event.clientX;
          y = (parseInt(style.top, 10)) - event.clientY;
          return event.dataTransfer.setData('application/json', JSON.stringify({x, y, id}));
        });
        //.......................................................................................................
        this.on(document.body, 'drop', on_drop = function(event) {
          var left, top, transfer;
          transfer = JSON.parse(event.dataTransfer.getData('application/json'));
          if (id !== transfer.id) {
            return;
          }
          left = event.clientX + transfer.x + 'px';
          top = event.clientY + transfer.y + 'px';
          µ.DOM.set_style_rule(element, 'left', left);
          µ.DOM.set_style_rule(element, 'top', top);
          event.preventDefault();
          return false;
        });
        //.......................................................................................................
        return null;
      }

      //---------------------------------------------------------------------------------------------------------
      _attach_dragover() {
        var on_dragover;
        /* TAINT Apparently need for correct dragging behavior, but what if we wanted to handle this event? */
        this.on(document.body, 'dragover', on_dragover = function(event) {
          event.preventDefault();
          return false;
        });
        this._attach_dragover = function() {};
        return null;
      }

    };

    //.........................................................................................................
    Dom.prototype._prv_draggable_id = 0;

    return Dom;

  }).call(this);

  //===========================================================================================================
  // MAGIC
  //-----------------------------------------------------------------------------------------------------------
  this._magic = Symbol.for('µDOM');

  this.TEXT = new Text();

  this.DOM = new Dom();

  this.LINEFINDER = require('./linefinder');

  this.KB = new (require('./kb')).Kb();

  // module.exports.rpr     ?= module.exports.µ.TEXT.rpr.bind( µ.TEXT )
// module.exports.log     ?= module.exports.µ.TEXT.log.bind( µ.TEXT )
/*

https://stackoverflow.com/a/117988/7568091

innerHTML is remarkably fast, and in many cases you will get the best results just setting that (I would
just use append).

However, if there is much already in "mydiv" then you are forcing the browser to parse and render all of
that content again (everything that was there before, plus all of your new content). You can avoid this by
appending a document fragment onto "mydiv" instead:

var frag = document.createDocumentFragment();
frag.innerHTML = html;
$("#mydiv").append(frag);
In this way, only your new content gets parsed (unavoidable) and the existing content does not.

EDIT: My bad... I've discovered that innerHTML isn't well supported on document fragments. You can use the
same technique with any node type. For your example, you could create the root table node and insert the
innerHTML into that:

var frag = document.createElement('table');
frag.innerHTML = tableInnerHtml;
$("#mydiv").append(frag);

*/

}).call(this);


},{"../loupe.js":33,"./kb":30,"./linefinder":31,"./types":32}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2Jyb3dzZXItcGFja0A2LjEuMC9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vYXZhaWxhYmxlLXR5cGVkLWFycmF5c0AxLjAuNS8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS93aGljaC10eXBlZC1hcnJheUAxLjEuMTEvbm9kZV9tb2R1bGVzL2F2YWlsYWJsZS10eXBlZC1hcnJheXMvaW5kZXguanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS9iYXNlNjQtanNAMS41LjEvbm9kZV9tb2R1bGVzL2Jhc2U2NC1qcy9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2Jyb3dzZXJpZnlAMTcuMC4wL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS9idWZmZXJANS4yLjEvbm9kZV9tb2R1bGVzL2J1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2NhbGwtYmluZEAxLjAuMi9ub2RlX21vZHVsZXMvY2FsbC1iaW5kL2NhbGxCb3VuZC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2NhbGwtYmluZEAxLjAuMi9ub2RlX21vZHVsZXMvY2FsbC1iaW5kL2luZGV4LmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vZm9yLWVhY2hAMC4zLjMvbm9kZV9tb2R1bGVzL2Zvci1lYWNoL2luZGV4LmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vZnVuY3Rpb24tYmluZEAxLjEuMS9ub2RlX21vZHVsZXMvZnVuY3Rpb24tYmluZC9pbXBsZW1lbnRhdGlvbi5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2Z1bmN0aW9uLWJpbmRAMS4xLjEvbm9kZV9tb2R1bGVzL2Z1bmN0aW9uLWJpbmQvaW5kZXguanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS9nZXQtaW50cmluc2ljQDEuMi4wL25vZGVfbW9kdWxlcy9nZXQtaW50cmluc2ljL2luZGV4LmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vZ29wZEAxLjAuMS9ub2RlX21vZHVsZXMvZ29wZC9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2hhcy1zeW1ib2xzQDEuMC4zL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2hhcy1zeW1ib2xzQDEuMC4zL25vZGVfbW9kdWxlcy9oYXMtc3ltYm9scy9zaGFtcy5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2hhcy10b3N0cmluZ3RhZ0AxLjAuMC9ub2RlX21vZHVsZXMvaGFzLXRvc3RyaW5ndGFnL3NoYW1zLmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vaGFzQDEuMC4zL25vZGVfbW9kdWxlcy9oYXMvc3JjL2luZGV4LmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vaWVlZTc1NEAxLjIuMS9ub2RlX21vZHVsZXMvaWVlZTc1NC9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2luaGVyaXRzQDIuMC40L25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vaXMtYXJndW1lbnRzQDEuMS4xL25vZGVfbW9kdWxlcy9pcy1hcmd1bWVudHMvaW5kZXguanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS9pcy1idWZmZXJAMS4xLjYvbm9kZV9tb2R1bGVzL2lzLWJ1ZmZlci9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2lzLWNhbGxhYmxlQDEuMi43L25vZGVfbW9kdWxlcy9pcy1jYWxsYWJsZS9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2lzLWdlbmVyYXRvci1mdW5jdGlvbkAxLjAuMTAvbm9kZV9tb2R1bGVzL2lzLWdlbmVyYXRvci1mdW5jdGlvbi9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL2lzLXR5cGVkLWFycmF5QDEuMS4xMi9ub2RlX21vZHVsZXMvaXMtdHlwZWQtYXJyYXkvaW5kZXguanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS9wYXRoLWJyb3dzZXJpZnlAMS4wLjEvbm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL3Byb2Nlc3NAMC4xMS4xMC9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vdXRpbEAwLjEyLjUvbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMiLCIuLi8uLi8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS91dGlsQDAuMTIuNS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L3R5cGVzLmpzIiwiLi4vLi4vLmxvY2FsL3NoYXJlL3BucG0vZ2xvYmFsLzUvLnBucG0vdXRpbEAwLjEyLjUvbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qcyIsIi4uLy4uLy5sb2NhbC9zaGFyZS9wbnBtL2dsb2JhbC81Ly5wbnBtL3doaWNoLXR5cGVkLWFycmF5QDEuMS4xMS8ubG9jYWwvc2hhcmUvcG5wbS9nbG9iYWwvNS8ucG5wbS91dGlsQDAuMTIuNS9ub2RlX21vZHVsZXMvd2hpY2gtdHlwZWQtYXJyYXkvaW5kZXguanMiLCIuLi9tdWRvbS9kZXBzL3RyYXZlcnNlX3V0aWwuanMiLCIuLi9tdWRvbS9saWIva2IuanMiLCIuLi9tdWRvbS9saWIvbGluZWZpbmRlci5qcyIsIi4uL211ZG9tL2xpYi90eXBlcy5qcyIsIi4uL211ZG9tL2xvdXBlLmpzIiwiLi4vbXVkb20vbm9kZV9tb2R1bGVzLy5wbnBtL2ludGVydHlwZUA3LjcuMS9ub2RlX21vZHVsZXMvaW50ZXJ0eXBlL2RlcHMvamtyb3NvLWVxdWFscy5qcyIsIi4uL211ZG9tL25vZGVfbW9kdWxlcy8ucG5wbS9pbnRlcnR5cGVANy43LjEvbm9kZV9tb2R1bGVzL2ludGVydHlwZS9kZXBzL2prcm9zby10eXBlLmpzIiwiLi4vbXVkb20vbm9kZV9tb2R1bGVzLy5wbnBtL2ludGVydHlwZUA3LjcuMS9ub2RlX21vZHVsZXMvaW50ZXJ0eXBlL2RlcHMvbG91cGUuanMiLCIuLi9tdWRvbS9ub2RlX21vZHVsZXMvLnBucG0vaW50ZXJ0eXBlQDcuNy4xL25vZGVfbW9kdWxlcy9pbnRlcnR5cGUvbGliL2NoZWNrcy5qcyIsIi4uL211ZG9tL25vZGVfbW9kdWxlcy8ucG5wbS9pbnRlcnR5cGVANy43LjEvbm9kZV9tb2R1bGVzL2ludGVydHlwZS9saWIvZGVjbGFyYXRpb25zLmpzIiwiLi4vbXVkb20vbm9kZV9tb2R1bGVzLy5wbnBtL2ludGVydHlwZUA3LjcuMS9ub2RlX21vZHVsZXMvaW50ZXJ0eXBlL2xpYi9kZWNsYXJpbmcuanMiLCIuLi9tdWRvbS9ub2RlX21vZHVsZXMvLnBucG0vaW50ZXJ0eXBlQDcuNy4xL25vZGVfbW9kdWxlcy9pbnRlcnR5cGUvbGliL2hlbHBlcnMuanMiLCIuLi9tdWRvbS9ub2RlX21vZHVsZXMvLnBucG0vaW50ZXJ0eXBlQDcuNy4xL25vZGVfbW9kdWxlcy9pbnRlcnR5cGUvbGliL21haW4uanMiLCIuLi9tdWRvbS9ub2RlX21vZHVsZXMvLnBucG0vaW50ZXJ0eXBlQDcuNy4xL25vZGVfbW9kdWxlcy9pbnRlcnR5cGUvbGliL3NpemluZy5qcyIsIi4uL211ZG9tL25vZGVfbW9kdWxlcy8ucG5wbS9tdWx0aW1peEA1LjAuMC9ub2RlX21vZHVsZXMvbXVsdGltaXgvbGliL2NhdGFsb2d1aW5nLmpzIiwiLi4vbXVkb20vbm9kZV9tb2R1bGVzLy5wbnBtL211bHRpbWl4QDUuMC4wL25vZGVfbW9kdWxlcy9tdWx0aW1peC9saWIvbWFpbi5qcyIsIm11ZG9tIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RKQTs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2p2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDamhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDOVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDM3NCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzkyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdkRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMXFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMzREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNXFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDcm1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciBwb3NzaWJsZU5hbWVzID0gW1xuXHQnQmlnSW50NjRBcnJheScsXG5cdCdCaWdVaW50NjRBcnJheScsXG5cdCdGbG9hdDMyQXJyYXknLFxuXHQnRmxvYXQ2NEFycmF5Jyxcblx0J0ludDE2QXJyYXknLFxuXHQnSW50MzJBcnJheScsXG5cdCdJbnQ4QXJyYXknLFxuXHQnVWludDE2QXJyYXknLFxuXHQnVWludDMyQXJyYXknLFxuXHQnVWludDhBcnJheScsXG5cdCdVaW50OENsYW1wZWRBcnJheSdcbl07XG5cbnZhciBnID0gdHlwZW9mIGdsb2JhbFRoaXMgPT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogZ2xvYmFsVGhpcztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBhdmFpbGFibGVUeXBlZEFycmF5cygpIHtcblx0dmFyIG91dCA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHBvc3NpYmxlTmFtZXMubGVuZ3RoOyBpKyspIHtcblx0XHRpZiAodHlwZW9mIGdbcG9zc2libGVOYW1lc1tpXV0gPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdG91dFtvdXQubGVuZ3RoXSA9IHBvc3NpYmxlTmFtZXNbaV07XG5cdFx0fVxuXHR9XG5cdHJldHVybiBvdXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMuYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGhcbmV4cG9ydHMudG9CeXRlQXJyYXkgPSB0b0J5dGVBcnJheVxuZXhwb3J0cy5mcm9tQnl0ZUFycmF5ID0gZnJvbUJ5dGVBcnJheVxuXG52YXIgbG9va3VwID0gW11cbnZhciByZXZMb29rdXAgPSBbXVxudmFyIEFyciA9IHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyA/IFVpbnQ4QXJyYXkgOiBBcnJheVxuXG52YXIgY29kZSA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJ1xuZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNvZGUubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgbG9va3VwW2ldID0gY29kZVtpXVxuICByZXZMb29rdXBbY29kZS5jaGFyQ29kZUF0KGkpXSA9IGlcbn1cblxuLy8gU3VwcG9ydCBkZWNvZGluZyBVUkwtc2FmZSBiYXNlNjQgc3RyaW5ncywgYXMgTm9kZS5qcyBkb2VzLlxuLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9CYXNlNjQjVVJMX2FwcGxpY2F0aW9uc1xucmV2TG9va3VwWyctJy5jaGFyQ29kZUF0KDApXSA9IDYyXG5yZXZMb29rdXBbJ18nLmNoYXJDb2RlQXQoMCldID0gNjNcblxuZnVuY3Rpb24gZ2V0TGVucyAoYjY0KSB7XG4gIHZhciBsZW4gPSBiNjQubGVuZ3RoXG5cbiAgaWYgKGxlbiAlIDQgPiAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHN0cmluZy4gTGVuZ3RoIG11c3QgYmUgYSBtdWx0aXBsZSBvZiA0JylcbiAgfVxuXG4gIC8vIFRyaW0gb2ZmIGV4dHJhIGJ5dGVzIGFmdGVyIHBsYWNlaG9sZGVyIGJ5dGVzIGFyZSBmb3VuZFxuICAvLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9iZWF0Z2FtbWl0L2Jhc2U2NC1qcy9pc3N1ZXMvNDJcbiAgdmFyIHZhbGlkTGVuID0gYjY0LmluZGV4T2YoJz0nKVxuICBpZiAodmFsaWRMZW4gPT09IC0xKSB2YWxpZExlbiA9IGxlblxuXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSB2YWxpZExlbiA9PT0gbGVuXG4gICAgPyAwXG4gICAgOiA0IC0gKHZhbGlkTGVuICUgNClcblxuICByZXR1cm4gW3ZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW5dXG59XG5cbi8vIGJhc2U2NCBpcyA0LzMgKyB1cCB0byB0d28gY2hhcmFjdGVycyBvZiB0aGUgb3JpZ2luYWwgZGF0YVxuZnVuY3Rpb24gYnl0ZUxlbmd0aCAoYjY0KSB7XG4gIHZhciBsZW5zID0gZ2V0TGVucyhiNjQpXG4gIHZhciB2YWxpZExlbiA9IGxlbnNbMF1cbiAgdmFyIHBsYWNlSG9sZGVyc0xlbiA9IGxlbnNbMV1cbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIF9ieXRlTGVuZ3RoIChiNjQsIHZhbGlkTGVuLCBwbGFjZUhvbGRlcnNMZW4pIHtcbiAgcmV0dXJuICgodmFsaWRMZW4gKyBwbGFjZUhvbGRlcnNMZW4pICogMyAvIDQpIC0gcGxhY2VIb2xkZXJzTGVuXG59XG5cbmZ1bmN0aW9uIHRvQnl0ZUFycmF5IChiNjQpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVucyA9IGdldExlbnMoYjY0KVxuICB2YXIgdmFsaWRMZW4gPSBsZW5zWzBdXG4gIHZhciBwbGFjZUhvbGRlcnNMZW4gPSBsZW5zWzFdXG5cbiAgdmFyIGFyciA9IG5ldyBBcnIoX2J5dGVMZW5ndGgoYjY0LCB2YWxpZExlbiwgcGxhY2VIb2xkZXJzTGVuKSlcblxuICB2YXIgY3VyQnl0ZSA9IDBcblxuICAvLyBpZiB0aGVyZSBhcmUgcGxhY2Vob2xkZXJzLCBvbmx5IGdldCB1cCB0byB0aGUgbGFzdCBjb21wbGV0ZSA0IGNoYXJzXG4gIHZhciBsZW4gPSBwbGFjZUhvbGRlcnNMZW4gPiAwXG4gICAgPyB2YWxpZExlbiAtIDRcbiAgICA6IHZhbGlkTGVuXG5cbiAgdmFyIGlcbiAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSArPSA0KSB7XG4gICAgdG1wID1cbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSldIDw8IDE4KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPDwgMTIpIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDIpXSA8PCA2KSB8XG4gICAgICByZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDMpXVxuICAgIGFycltjdXJCeXRlKytdID0gKHRtcCA+PiAxNikgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSAodG1wID4+IDgpICYgMHhGRlxuICAgIGFycltjdXJCeXRlKytdID0gdG1wICYgMHhGRlxuICB9XG5cbiAgaWYgKHBsYWNlSG9sZGVyc0xlbiA9PT0gMikge1xuICAgIHRtcCA9XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkpXSA8PCAyKSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAxKV0gPj4gNClcbiAgICBhcnJbY3VyQnl0ZSsrXSA9IHRtcCAmIDB4RkZcbiAgfVxuXG4gIGlmIChwbGFjZUhvbGRlcnNMZW4gPT09IDEpIHtcbiAgICB0bXAgPVxuICAgICAgKHJldkxvb2t1cFtiNjQuY2hhckNvZGVBdChpKV0gPDwgMTApIHxcbiAgICAgIChyZXZMb29rdXBbYjY0LmNoYXJDb2RlQXQoaSArIDEpXSA8PCA0KSB8XG4gICAgICAocmV2TG9va3VwW2I2NC5jaGFyQ29kZUF0KGkgKyAyKV0gPj4gMilcbiAgICBhcnJbY3VyQnl0ZSsrXSA9ICh0bXAgPj4gOCkgJiAweEZGXG4gICAgYXJyW2N1ckJ5dGUrK10gPSB0bXAgJiAweEZGXG4gIH1cblxuICByZXR1cm4gYXJyXG59XG5cbmZ1bmN0aW9uIHRyaXBsZXRUb0Jhc2U2NCAobnVtKSB7XG4gIHJldHVybiBsb29rdXBbbnVtID4+IDE4ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gPj4gMTIgJiAweDNGXSArXG4gICAgbG9va3VwW251bSA+PiA2ICYgMHgzRl0gK1xuICAgIGxvb2t1cFtudW0gJiAweDNGXVxufVxuXG5mdW5jdGlvbiBlbmNvZGVDaHVuayAodWludDgsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHRtcFxuICB2YXIgb3V0cHV0ID0gW11cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpICs9IDMpIHtcbiAgICB0bXAgPVxuICAgICAgKCh1aW50OFtpXSA8PCAxNikgJiAweEZGMDAwMCkgK1xuICAgICAgKCh1aW50OFtpICsgMV0gPDwgOCkgJiAweEZGMDApICtcbiAgICAgICh1aW50OFtpICsgMl0gJiAweEZGKVxuICAgIG91dHB1dC5wdXNoKHRyaXBsZXRUb0Jhc2U2NCh0bXApKVxuICB9XG4gIHJldHVybiBvdXRwdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gZnJvbUJ5dGVBcnJheSAodWludDgpIHtcbiAgdmFyIHRtcFxuICB2YXIgbGVuID0gdWludDgubGVuZ3RoXG4gIHZhciBleHRyYUJ5dGVzID0gbGVuICUgMyAvLyBpZiB3ZSBoYXZlIDEgYnl0ZSBsZWZ0LCBwYWQgMiBieXRlc1xuICB2YXIgcGFydHMgPSBbXVxuICB2YXIgbWF4Q2h1bmtMZW5ndGggPSAxNjM4MyAvLyBtdXN0IGJlIG11bHRpcGxlIG9mIDNcblxuICAvLyBnbyB0aHJvdWdoIHRoZSBhcnJheSBldmVyeSB0aHJlZSBieXRlcywgd2UnbGwgZGVhbCB3aXRoIHRyYWlsaW5nIHN0dWZmIGxhdGVyXG4gIGZvciAodmFyIGkgPSAwLCBsZW4yID0gbGVuIC0gZXh0cmFCeXRlczsgaSA8IGxlbjI7IGkgKz0gbWF4Q2h1bmtMZW5ndGgpIHtcbiAgICBwYXJ0cy5wdXNoKGVuY29kZUNodW5rKHVpbnQ4LCBpLCAoaSArIG1heENodW5rTGVuZ3RoKSA+IGxlbjIgPyBsZW4yIDogKGkgKyBtYXhDaHVua0xlbmd0aCkpKVxuICB9XG5cbiAgLy8gcGFkIHRoZSBlbmQgd2l0aCB6ZXJvcywgYnV0IG1ha2Ugc3VyZSB0byBub3QgZm9yZ2V0IHRoZSBleHRyYSBieXRlc1xuICBpZiAoZXh0cmFCeXRlcyA9PT0gMSkge1xuICAgIHRtcCA9IHVpbnQ4W2xlbiAtIDFdXG4gICAgcGFydHMucHVzaChcbiAgICAgIGxvb2t1cFt0bXAgPj4gMl0gK1xuICAgICAgbG9va3VwWyh0bXAgPDwgNCkgJiAweDNGXSArXG4gICAgICAnPT0nXG4gICAgKVxuICB9IGVsc2UgaWYgKGV4dHJhQnl0ZXMgPT09IDIpIHtcbiAgICB0bXAgPSAodWludDhbbGVuIC0gMl0gPDwgOCkgKyB1aW50OFtsZW4gLSAxXVxuICAgIHBhcnRzLnB1c2goXG4gICAgICBsb29rdXBbdG1wID4+IDEwXSArXG4gICAgICBsb29rdXBbKHRtcCA+PiA0KSAmIDB4M0ZdICtcbiAgICAgIGxvb2t1cFsodG1wIDw8IDIpICYgMHgzRl0gK1xuICAgICAgJz0nXG4gICAgKVxuICB9XG5cbiAgcmV0dXJuIHBhcnRzLmpvaW4oJycpXG59XG4iLCIiLCIvKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmc+XG4gKiBAbGljZW5zZSAgTUlUXG4gKi9cbi8qIGVzbGludC1kaXNhYmxlIG5vLXByb3RvICovXG5cbid1c2Ugc3RyaWN0J1xuXG52YXIgYmFzZTY0ID0gcmVxdWlyZSgnYmFzZTY0LWpzJylcbnZhciBpZWVlNzU0ID0gcmVxdWlyZSgnaWVlZTc1NCcpXG5cbmV4cG9ydHMuQnVmZmVyID0gQnVmZmVyXG5leHBvcnRzLlNsb3dCdWZmZXIgPSBTbG93QnVmZmVyXG5leHBvcnRzLklOU1BFQ1RfTUFYX0JZVEVTID0gNTBcblxudmFyIEtfTUFYX0xFTkdUSCA9IDB4N2ZmZmZmZmZcbmV4cG9ydHMua01heExlbmd0aCA9IEtfTUFYX0xFTkdUSFxuXG4vKipcbiAqIElmIGBCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVGA6XG4gKiAgID09PSB0cnVlICAgIFVzZSBVaW50OEFycmF5IGltcGxlbWVudGF0aW9uIChmYXN0ZXN0KVxuICogICA9PT0gZmFsc2UgICBQcmludCB3YXJuaW5nIGFuZCByZWNvbW1lbmQgdXNpbmcgYGJ1ZmZlcmAgdjQueCB3aGljaCBoYXMgYW4gT2JqZWN0XG4gKiAgICAgICAgICAgICAgIGltcGxlbWVudGF0aW9uIChtb3N0IGNvbXBhdGlibGUsIGV2ZW4gSUU2KVxuICpcbiAqIEJyb3dzZXJzIHRoYXQgc3VwcG9ydCB0eXBlZCBhcnJheXMgYXJlIElFIDEwKywgRmlyZWZveCA0KywgQ2hyb21lIDcrLCBTYWZhcmkgNS4xKyxcbiAqIE9wZXJhIDExLjYrLCBpT1MgNC4yKy5cbiAqXG4gKiBXZSByZXBvcnQgdGhhdCB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHR5cGVkIGFycmF5cyBpZiB0aGUgYXJlIG5vdCBzdWJjbGFzc2FibGVcbiAqIHVzaW5nIF9fcHJvdG9fXy4gRmlyZWZveCA0LTI5IGxhY2tzIHN1cHBvcnQgZm9yIGFkZGluZyBuZXcgcHJvcGVydGllcyB0byBgVWludDhBcnJheWBcbiAqIChTZWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTY5NTQzOCkuIElFIDEwIGxhY2tzIHN1cHBvcnRcbiAqIGZvciBfX3Byb3RvX18gYW5kIGhhcyBhIGJ1Z2d5IHR5cGVkIGFycmF5IGltcGxlbWVudGF0aW9uLlxuICovXG5CdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCA9IHR5cGVkQXJyYXlTdXBwb3J0KClcblxuaWYgKCFCdWZmZXIuVFlQRURfQVJSQVlfU1VQUE9SVCAmJiB0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICB0eXBlb2YgY29uc29sZS5lcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICBjb25zb2xlLmVycm9yKFxuICAgICdUaGlzIGJyb3dzZXIgbGFja3MgdHlwZWQgYXJyYXkgKFVpbnQ4QXJyYXkpIHN1cHBvcnQgd2hpY2ggaXMgcmVxdWlyZWQgYnkgJyArXG4gICAgJ2BidWZmZXJgIHY1LnguIFVzZSBgYnVmZmVyYCB2NC54IGlmIHlvdSByZXF1aXJlIG9sZCBicm93c2VyIHN1cHBvcnQuJ1xuICApXG59XG5cbmZ1bmN0aW9uIHR5cGVkQXJyYXlTdXBwb3J0ICgpIHtcbiAgLy8gQ2FuIHR5cGVkIGFycmF5IGluc3RhbmNlcyBjYW4gYmUgYXVnbWVudGVkP1xuICB0cnkge1xuICAgIHZhciBhcnIgPSBuZXcgVWludDhBcnJheSgxKVxuICAgIGFyci5fX3Byb3RvX18gPSB7IF9fcHJvdG9fXzogVWludDhBcnJheS5wcm90b3R5cGUsIGZvbzogZnVuY3Rpb24gKCkgeyByZXR1cm4gNDIgfSB9XG4gICAgcmV0dXJuIGFyci5mb28oKSA9PT0gNDJcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShCdWZmZXIucHJvdG90eXBlLCAncGFyZW50Jywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcih0aGlzKSkgcmV0dXJuIHVuZGVmaW5lZFxuICAgIHJldHVybiB0aGlzLmJ1ZmZlclxuICB9XG59KVxuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLnByb3RvdHlwZSwgJ29mZnNldCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIodGhpcykpIHJldHVybiB1bmRlZmluZWRcbiAgICByZXR1cm4gdGhpcy5ieXRlT2Zmc2V0XG4gIH1cbn0pXG5cbmZ1bmN0aW9uIGNyZWF0ZUJ1ZmZlciAobGVuZ3RoKSB7XG4gIGlmIChsZW5ndGggPiBLX01BWF9MRU5HVEgpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIGxlbmd0aCArICdcIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJzaXplXCInKVxuICB9XG4gIC8vIFJldHVybiBhbiBhdWdtZW50ZWQgYFVpbnQ4QXJyYXlgIGluc3RhbmNlXG4gIHZhciBidWYgPSBuZXcgVWludDhBcnJheShsZW5ndGgpXG4gIGJ1Zi5fX3Byb3RvX18gPSBCdWZmZXIucHJvdG90eXBlXG4gIHJldHVybiBidWZcbn1cblxuLyoqXG4gKiBUaGUgQnVmZmVyIGNvbnN0cnVjdG9yIHJldHVybnMgaW5zdGFuY2VzIG9mIGBVaW50OEFycmF5YCB0aGF0IGhhdmUgdGhlaXJcbiAqIHByb3RvdHlwZSBjaGFuZ2VkIHRvIGBCdWZmZXIucHJvdG90eXBlYC4gRnVydGhlcm1vcmUsIGBCdWZmZXJgIGlzIGEgc3ViY2xhc3Mgb2ZcbiAqIGBVaW50OEFycmF5YCwgc28gdGhlIHJldHVybmVkIGluc3RhbmNlcyB3aWxsIGhhdmUgYWxsIHRoZSBub2RlIGBCdWZmZXJgIG1ldGhvZHNcbiAqIGFuZCB0aGUgYFVpbnQ4QXJyYXlgIG1ldGhvZHMuIFNxdWFyZSBicmFja2V0IG5vdGF0aW9uIHdvcmtzIGFzIGV4cGVjdGVkIC0tIGl0XG4gKiByZXR1cm5zIGEgc2luZ2xlIG9jdGV0LlxuICpcbiAqIFRoZSBgVWludDhBcnJheWAgcHJvdG90eXBlIHJlbWFpbnMgdW5tb2RpZmllZC5cbiAqL1xuXG5mdW5jdGlvbiBCdWZmZXIgKGFyZywgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKSB7XG4gIC8vIENvbW1vbiBjYXNlLlxuICBpZiAodHlwZW9mIGFyZyA9PT0gJ251bWJlcicpIHtcbiAgICBpZiAodHlwZW9mIGVuY29kaW5nT3JPZmZzZXQgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIHN0cmluZy4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgICApXG4gICAgfVxuICAgIHJldHVybiBhbGxvY1Vuc2FmZShhcmcpXG4gIH1cbiAgcmV0dXJuIGZyb20oYXJnLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG59XG5cbi8vIEZpeCBzdWJhcnJheSgpIGluIEVTMjAxNi4gU2VlOiBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzk3XG5pZiAodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnNwZWNpZXMgIT0gbnVsbCAmJlxuICAgIEJ1ZmZlcltTeW1ib2wuc3BlY2llc10gPT09IEJ1ZmZlcikge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoQnVmZmVyLCBTeW1ib2wuc3BlY2llcywge1xuICAgIHZhbHVlOiBudWxsLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICBlbnVtZXJhYmxlOiBmYWxzZSxcbiAgICB3cml0YWJsZTogZmFsc2VcbiAgfSlcbn1cblxuQnVmZmVyLnBvb2xTaXplID0gODE5MiAvLyBub3QgdXNlZCBieSB0aGlzIGltcGxlbWVudGF0aW9uXG5cbmZ1bmN0aW9uIGZyb20gKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gZnJvbVN0cmluZyh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldClcbiAgfVxuXG4gIGlmIChBcnJheUJ1ZmZlci5pc1ZpZXcodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2UodmFsdWUpXG4gIH1cblxuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIHRocm93IFR5cGVFcnJvcihcbiAgICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAgICdvciBBcnJheS1saWtlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgKHR5cGVvZiB2YWx1ZSlcbiAgICApXG4gIH1cblxuICBpZiAoaXNJbnN0YW5jZSh2YWx1ZSwgQXJyYXlCdWZmZXIpIHx8XG4gICAgICAodmFsdWUgJiYgaXNJbnN0YW5jZSh2YWx1ZS5idWZmZXIsIEFycmF5QnVmZmVyKSkpIHtcbiAgICByZXR1cm4gZnJvbUFycmF5QnVmZmVyKHZhbHVlLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwidmFsdWVcIiBhcmd1bWVudCBtdXN0IG5vdCBiZSBvZiB0eXBlIG51bWJlci4gUmVjZWl2ZWQgdHlwZSBudW1iZXInXG4gICAgKVxuICB9XG5cbiAgdmFyIHZhbHVlT2YgPSB2YWx1ZS52YWx1ZU9mICYmIHZhbHVlLnZhbHVlT2YoKVxuICBpZiAodmFsdWVPZiAhPSBudWxsICYmIHZhbHVlT2YgIT09IHZhbHVlKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHZhbHVlT2YsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aClcbiAgfVxuXG4gIHZhciBiID0gZnJvbU9iamVjdCh2YWx1ZSlcbiAgaWYgKGIpIHJldHVybiBiXG5cbiAgaWYgKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1ByaW1pdGl2ZSAhPSBudWxsICYmXG4gICAgICB0eXBlb2YgdmFsdWVbU3ltYm9sLnRvUHJpbWl0aXZlXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShcbiAgICAgIHZhbHVlW1N5bWJvbC50b1ByaW1pdGl2ZV0oJ3N0cmluZycpLCBlbmNvZGluZ09yT2Zmc2V0LCBsZW5ndGhcbiAgICApXG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICdUaGUgZmlyc3QgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIEFycmF5LCAnICtcbiAgICAnb3IgQXJyYXktbGlrZSBPYmplY3QuIFJlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdmFsdWUpXG4gIClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbmFsbHkgZXF1aXZhbGVudCB0byBCdWZmZXIoYXJnLCBlbmNvZGluZykgYnV0IHRocm93cyBhIFR5cGVFcnJvclxuICogaWYgdmFsdWUgaXMgYSBudW1iZXIuXG4gKiBCdWZmZXIuZnJvbShzdHJbLCBlbmNvZGluZ10pXG4gKiBCdWZmZXIuZnJvbShhcnJheSlcbiAqIEJ1ZmZlci5mcm9tKGJ1ZmZlcilcbiAqIEJ1ZmZlci5mcm9tKGFycmF5QnVmZmVyWywgYnl0ZU9mZnNldFssIGxlbmd0aF1dKVxuICoqL1xuQnVmZmVyLmZyb20gPSBmdW5jdGlvbiAodmFsdWUsIGVuY29kaW5nT3JPZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gZnJvbSh2YWx1ZSwgZW5jb2RpbmdPck9mZnNldCwgbGVuZ3RoKVxufVxuXG4vLyBOb3RlOiBDaGFuZ2UgcHJvdG90eXBlICphZnRlciogQnVmZmVyLmZyb20gaXMgZGVmaW5lZCB0byB3b3JrYXJvdW5kIENocm9tZSBidWc6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vZmVyb3NzL2J1ZmZlci9wdWxsLzE0OFxuQnVmZmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBVaW50OEFycmF5LnByb3RvdHlwZVxuQnVmZmVyLl9fcHJvdG9fXyA9IFVpbnQ4QXJyYXlcblxuZnVuY3Rpb24gYXNzZXJ0U2l6ZSAoc2l6ZSkge1xuICBpZiAodHlwZW9mIHNpemUgIT09ICdudW1iZXInKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJzaXplXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIG51bWJlcicpXG4gIH0gZWxzZSBpZiAoc2l6ZSA8IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignVGhlIHZhbHVlIFwiJyArIHNpemUgKyAnXCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwic2l6ZVwiJylcbiAgfVxufVxuXG5mdW5jdGlvbiBhbGxvYyAoc2l6ZSwgZmlsbCwgZW5jb2RpbmcpIHtcbiAgYXNzZXJ0U2l6ZShzaXplKVxuICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxuICB9XG4gIGlmIChmaWxsICE9PSB1bmRlZmluZWQpIHtcbiAgICAvLyBPbmx5IHBheSBhdHRlbnRpb24gdG8gZW5jb2RpbmcgaWYgaXQncyBhIHN0cmluZy4gVGhpc1xuICAgIC8vIHByZXZlbnRzIGFjY2lkZW50YWxseSBzZW5kaW5nIGluIGEgbnVtYmVyIHRoYXQgd291bGRcbiAgICAvLyBiZSBpbnRlcnByZXR0ZWQgYXMgYSBzdGFydCBvZmZzZXQuXG4gICAgcmV0dXJuIHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZydcbiAgICAgID8gY3JlYXRlQnVmZmVyKHNpemUpLmZpbGwoZmlsbCwgZW5jb2RpbmcpXG4gICAgICA6IGNyZWF0ZUJ1ZmZlcihzaXplKS5maWxsKGZpbGwpXG4gIH1cbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqIGFsbG9jKHNpemVbLCBmaWxsWywgZW5jb2RpbmddXSlcbiAqKi9cbkJ1ZmZlci5hbGxvYyA9IGZ1bmN0aW9uIChzaXplLCBmaWxsLCBlbmNvZGluZykge1xuICByZXR1cm4gYWxsb2Moc2l6ZSwgZmlsbCwgZW5jb2RpbmcpXG59XG5cbmZ1bmN0aW9uIGFsbG9jVW5zYWZlIChzaXplKSB7XG4gIGFzc2VydFNpemUoc2l6ZSlcbiAgcmV0dXJuIGNyZWF0ZUJ1ZmZlcihzaXplIDwgMCA/IDAgOiBjaGVja2VkKHNpemUpIHwgMClcbn1cblxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIEJ1ZmZlcihudW0pLCBieSBkZWZhdWx0IGNyZWF0ZXMgYSBub24temVyby1maWxsZWQgQnVmZmVyIGluc3RhbmNlLlxuICogKi9cbkJ1ZmZlci5hbGxvY1Vuc2FmZSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuLyoqXG4gKiBFcXVpdmFsZW50IHRvIFNsb3dCdWZmZXIobnVtKSwgYnkgZGVmYXVsdCBjcmVhdGVzIGEgbm9uLXplcm8tZmlsbGVkIEJ1ZmZlciBpbnN0YW5jZS5cbiAqL1xuQnVmZmVyLmFsbG9jVW5zYWZlU2xvdyA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIHJldHVybiBhbGxvY1Vuc2FmZShzaXplKVxufVxuXG5mdW5jdGlvbiBmcm9tU3RyaW5nIChzdHJpbmcsIGVuY29kaW5nKSB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnIHx8IGVuY29kaW5nID09PSAnJykge1xuICAgIGVuY29kaW5nID0gJ3V0ZjgnXG4gIH1cblxuICBpZiAoIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1Vua25vd24gZW5jb2Rpbmc6ICcgKyBlbmNvZGluZylcbiAgfVxuXG4gIHZhciBsZW5ndGggPSBieXRlTGVuZ3RoKHN0cmluZywgZW5jb2RpbmcpIHwgMFxuICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbmd0aClcblxuICB2YXIgYWN0dWFsID0gYnVmLndyaXRlKHN0cmluZywgZW5jb2RpbmcpXG5cbiAgaWYgKGFjdHVhbCAhPT0gbGVuZ3RoKSB7XG4gICAgLy8gV3JpdGluZyBhIGhleCBzdHJpbmcsIGZvciBleGFtcGxlLCB0aGF0IGNvbnRhaW5zIGludmFsaWQgY2hhcmFjdGVycyB3aWxsXG4gICAgLy8gY2F1c2UgZXZlcnl0aGluZyBhZnRlciB0aGUgZmlyc3QgaW52YWxpZCBjaGFyYWN0ZXIgdG8gYmUgaWdub3JlZC4gKGUuZy5cbiAgICAvLyAnYWJ4eGNkJyB3aWxsIGJlIHRyZWF0ZWQgYXMgJ2FiJylcbiAgICBidWYgPSBidWYuc2xpY2UoMCwgYWN0dWFsKVxuICB9XG5cbiAgcmV0dXJuIGJ1ZlxufVxuXG5mdW5jdGlvbiBmcm9tQXJyYXlMaWtlIChhcnJheSkge1xuICB2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoIDwgMCA/IDAgOiBjaGVja2VkKGFycmF5Lmxlbmd0aCkgfCAwXG4gIHZhciBidWYgPSBjcmVhdGVCdWZmZXIobGVuZ3RoKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAxKSB7XG4gICAgYnVmW2ldID0gYXJyYXlbaV0gJiAyNTVcbiAgfVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21BcnJheUJ1ZmZlciAoYXJyYXksIGJ5dGVPZmZzZXQsIGxlbmd0aCkge1xuICBpZiAoYnl0ZU9mZnNldCA8IDAgfHwgYXJyYXkuYnl0ZUxlbmd0aCA8IGJ5dGVPZmZzZXQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignXCJvZmZzZXRcIiBpcyBvdXRzaWRlIG9mIGJ1ZmZlciBib3VuZHMnKVxuICB9XG5cbiAgaWYgKGFycmF5LmJ5dGVMZW5ndGggPCBieXRlT2Zmc2V0ICsgKGxlbmd0aCB8fCAwKSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdcImxlbmd0aFwiIGlzIG91dHNpZGUgb2YgYnVmZmVyIGJvdW5kcycpXG4gIH1cblxuICB2YXIgYnVmXG4gIGlmIChieXRlT2Zmc2V0ID09PSB1bmRlZmluZWQgJiYgbGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICBidWYgPSBuZXcgVWludDhBcnJheShhcnJheSlcbiAgfSBlbHNlIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0KVxuICB9IGVsc2Uge1xuICAgIGJ1ZiA9IG5ldyBVaW50OEFycmF5KGFycmF5LCBieXRlT2Zmc2V0LCBsZW5ndGgpXG4gIH1cblxuICAvLyBSZXR1cm4gYW4gYXVnbWVudGVkIGBVaW50OEFycmF5YCBpbnN0YW5jZVxuICBidWYuX19wcm90b19fID0gQnVmZmVyLnByb3RvdHlwZVxuICByZXR1cm4gYnVmXG59XG5cbmZ1bmN0aW9uIGZyb21PYmplY3QgKG9iaikge1xuICBpZiAoQnVmZmVyLmlzQnVmZmVyKG9iaikpIHtcbiAgICB2YXIgbGVuID0gY2hlY2tlZChvYmoubGVuZ3RoKSB8IDBcbiAgICB2YXIgYnVmID0gY3JlYXRlQnVmZmVyKGxlbilcblxuICAgIGlmIChidWYubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gYnVmXG4gICAgfVxuXG4gICAgb2JqLmNvcHkoYnVmLCAwLCAwLCBsZW4pXG4gICAgcmV0dXJuIGJ1ZlxuICB9XG5cbiAgaWYgKG9iai5sZW5ndGggIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2Ygb2JqLmxlbmd0aCAhPT0gJ251bWJlcicgfHwgbnVtYmVySXNOYU4ob2JqLmxlbmd0aCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVCdWZmZXIoMClcbiAgICB9XG4gICAgcmV0dXJuIGZyb21BcnJheUxpa2Uob2JqKVxuICB9XG5cbiAgaWYgKG9iai50eXBlID09PSAnQnVmZmVyJyAmJiBBcnJheS5pc0FycmF5KG9iai5kYXRhKSkge1xuICAgIHJldHVybiBmcm9tQXJyYXlMaWtlKG9iai5kYXRhKVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrZWQgKGxlbmd0aCkge1xuICAvLyBOb3RlOiBjYW5ub3QgdXNlIGBsZW5ndGggPCBLX01BWF9MRU5HVEhgIGhlcmUgYmVjYXVzZSB0aGF0IGZhaWxzIHdoZW5cbiAgLy8gbGVuZ3RoIGlzIE5hTiAod2hpY2ggaXMgb3RoZXJ3aXNlIGNvZXJjZWQgdG8gemVyby4pXG4gIGlmIChsZW5ndGggPj0gS19NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gYWxsb2NhdGUgQnVmZmVyIGxhcmdlciB0aGFuIG1heGltdW0gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ3NpemU6IDB4JyArIEtfTUFYX0xFTkdUSC50b1N0cmluZygxNikgKyAnIGJ5dGVzJylcbiAgfVxuICByZXR1cm4gbGVuZ3RoIHwgMFxufVxuXG5mdW5jdGlvbiBTbG93QnVmZmVyIChsZW5ndGgpIHtcbiAgaWYgKCtsZW5ndGggIT0gbGVuZ3RoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG4gICAgbGVuZ3RoID0gMFxuICB9XG4gIHJldHVybiBCdWZmZXIuYWxsb2MoK2xlbmd0aClcbn1cblxuQnVmZmVyLmlzQnVmZmVyID0gZnVuY3Rpb24gaXNCdWZmZXIgKGIpIHtcbiAgcmV0dXJuIGIgIT0gbnVsbCAmJiBiLl9pc0J1ZmZlciA9PT0gdHJ1ZSAmJlxuICAgIGIgIT09IEJ1ZmZlci5wcm90b3R5cGUgLy8gc28gQnVmZmVyLmlzQnVmZmVyKEJ1ZmZlci5wcm90b3R5cGUpIHdpbGwgYmUgZmFsc2Vcbn1cblxuQnVmZmVyLmNvbXBhcmUgPSBmdW5jdGlvbiBjb21wYXJlIChhLCBiKSB7XG4gIGlmIChpc0luc3RhbmNlKGEsIFVpbnQ4QXJyYXkpKSBhID0gQnVmZmVyLmZyb20oYSwgYS5vZmZzZXQsIGEuYnl0ZUxlbmd0aClcbiAgaWYgKGlzSW5zdGFuY2UoYiwgVWludDhBcnJheSkpIGIgPSBCdWZmZXIuZnJvbShiLCBiLm9mZnNldCwgYi5ieXRlTGVuZ3RoKVxuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihhKSB8fCAhQnVmZmVyLmlzQnVmZmVyKGIpKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICdUaGUgXCJidWYxXCIsIFwiYnVmMlwiIGFyZ3VtZW50cyBtdXN0IGJlIG9uZSBvZiB0eXBlIEJ1ZmZlciBvciBVaW50OEFycmF5J1xuICAgIClcbiAgfVxuXG4gIGlmIChhID09PSBiKSByZXR1cm4gMFxuXG4gIHZhciB4ID0gYS5sZW5ndGhcbiAgdmFyIHkgPSBiLmxlbmd0aFxuXG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSBNYXRoLm1pbih4LCB5KTsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYgKGFbaV0gIT09IGJbaV0pIHtcbiAgICAgIHggPSBhW2ldXG4gICAgICB5ID0gYltpXVxuICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBpZiAoeCA8IHkpIHJldHVybiAtMVxuICBpZiAoeSA8IHgpIHJldHVybiAxXG4gIHJldHVybiAwXG59XG5cbkJ1ZmZlci5pc0VuY29kaW5nID0gZnVuY3Rpb24gaXNFbmNvZGluZyAoZW5jb2RpbmcpIHtcbiAgc3dpdGNoIChTdHJpbmcoZW5jb2RpbmcpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICBjYXNlICdoZXgnOlxuICAgIGNhc2UgJ3V0ZjgnOlxuICAgIGNhc2UgJ3V0Zi04JzpcbiAgICBjYXNlICdhc2NpaSc6XG4gICAgY2FzZSAnbGF0aW4xJzpcbiAgICBjYXNlICdiaW5hcnknOlxuICAgIGNhc2UgJ2Jhc2U2NCc6XG4gICAgY2FzZSAndWNzMic6XG4gICAgY2FzZSAndWNzLTInOlxuICAgIGNhc2UgJ3V0ZjE2bGUnOlxuICAgIGNhc2UgJ3V0Zi0xNmxlJzpcbiAgICAgIHJldHVybiB0cnVlXG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmYWxzZVxuICB9XG59XG5cbkJ1ZmZlci5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQgKGxpc3QsIGxlbmd0aCkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkobGlzdCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImxpc3RcIiBhcmd1bWVudCBtdXN0IGJlIGFuIEFycmF5IG9mIEJ1ZmZlcnMnKVxuICB9XG5cbiAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIEJ1ZmZlci5hbGxvYygwKVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGxlbmd0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbGVuZ3RoID0gMFxuICAgIGZvciAoaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgKytpKSB7XG4gICAgICBsZW5ndGggKz0gbGlzdFtpXS5sZW5ndGhcbiAgICB9XG4gIH1cblxuICB2YXIgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKGxlbmd0aClcbiAgdmFyIHBvcyA9IDBcbiAgZm9yIChpID0gMDsgaSA8IGxpc3QubGVuZ3RoOyArK2kpIHtcbiAgICB2YXIgYnVmID0gbGlzdFtpXVxuICAgIGlmIChpc0luc3RhbmNlKGJ1ZiwgVWludDhBcnJheSkpIHtcbiAgICAgIGJ1ZiA9IEJ1ZmZlci5mcm9tKGJ1ZilcbiAgICB9XG4gICAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYnVmKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJsaXN0XCIgYXJndW1lbnQgbXVzdCBiZSBhbiBBcnJheSBvZiBCdWZmZXJzJylcbiAgICB9XG4gICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpXG4gICAgcG9zICs9IGJ1Zi5sZW5ndGhcbiAgfVxuICByZXR1cm4gYnVmZmVyXG59XG5cbmZ1bmN0aW9uIGJ5dGVMZW5ndGggKHN0cmluZywgZW5jb2RpbmcpIHtcbiAgaWYgKEJ1ZmZlci5pc0J1ZmZlcihzdHJpbmcpKSB7XG4gICAgcmV0dXJuIHN0cmluZy5sZW5ndGhcbiAgfVxuICBpZiAoQXJyYXlCdWZmZXIuaXNWaWV3KHN0cmluZykgfHwgaXNJbnN0YW5jZShzdHJpbmcsIEFycmF5QnVmZmVyKSkge1xuICAgIHJldHVybiBzdHJpbmcuYnl0ZUxlbmd0aFxuICB9XG4gIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAnVGhlIFwic3RyaW5nXCIgYXJndW1lbnQgbXVzdCBiZSBvbmUgb2YgdHlwZSBzdHJpbmcsIEJ1ZmZlciwgb3IgQXJyYXlCdWZmZXIuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArIHR5cGVvZiBzdHJpbmdcbiAgICApXG4gIH1cblxuICB2YXIgbGVuID0gc3RyaW5nLmxlbmd0aFxuICB2YXIgbXVzdE1hdGNoID0gKGFyZ3VtZW50cy5sZW5ndGggPiAyICYmIGFyZ3VtZW50c1syXSA9PT0gdHJ1ZSlcbiAgaWYgKCFtdXN0TWF0Y2ggJiYgbGVuID09PSAwKSByZXR1cm4gMFxuXG4gIC8vIFVzZSBhIGZvciBsb29wIHRvIGF2b2lkIHJlY3Vyc2lvblxuICB2YXIgbG93ZXJlZENhc2UgPSBmYWxzZVxuICBmb3IgKDs7KSB7XG4gICAgc3dpdGNoIChlbmNvZGluZykge1xuICAgICAgY2FzZSAnYXNjaWknOlxuICAgICAgY2FzZSAnbGF0aW4xJzpcbiAgICAgIGNhc2UgJ2JpbmFyeSc6XG4gICAgICAgIHJldHVybiBsZW5cbiAgICAgIGNhc2UgJ3V0ZjgnOlxuICAgICAgY2FzZSAndXRmLTgnOlxuICAgICAgICByZXR1cm4gdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGhcbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiBsZW4gKiAyXG4gICAgICBjYXNlICdoZXgnOlxuICAgICAgICByZXR1cm4gbGVuID4+PiAxXG4gICAgICBjYXNlICdiYXNlNjQnOlxuICAgICAgICByZXR1cm4gYmFzZTY0VG9CeXRlcyhzdHJpbmcpLmxlbmd0aFxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB7XG4gICAgICAgICAgcmV0dXJuIG11c3RNYXRjaCA/IC0xIDogdXRmOFRvQnl0ZXMoc3RyaW5nKS5sZW5ndGggLy8gYXNzdW1lIHV0ZjhcbiAgICAgICAgfVxuICAgICAgICBlbmNvZGluZyA9ICgnJyArIGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgICAgIGxvd2VyZWRDYXNlID0gdHJ1ZVxuICAgIH1cbiAgfVxufVxuQnVmZmVyLmJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoXG5cbmZ1bmN0aW9uIHNsb3dUb1N0cmluZyAoZW5jb2RpbmcsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcblxuICAvLyBObyBuZWVkIHRvIHZlcmlmeSB0aGF0IFwidGhpcy5sZW5ndGggPD0gTUFYX1VJTlQzMlwiIHNpbmNlIGl0J3MgYSByZWFkLW9ubHlcbiAgLy8gcHJvcGVydHkgb2YgYSB0eXBlZCBhcnJheS5cblxuICAvLyBUaGlzIGJlaGF2ZXMgbmVpdGhlciBsaWtlIFN0cmluZyBub3IgVWludDhBcnJheSBpbiB0aGF0IHdlIHNldCBzdGFydC9lbmRcbiAgLy8gdG8gdGhlaXIgdXBwZXIvbG93ZXIgYm91bmRzIGlmIHRoZSB2YWx1ZSBwYXNzZWQgaXMgb3V0IG9mIHJhbmdlLlxuICAvLyB1bmRlZmluZWQgaXMgaGFuZGxlZCBzcGVjaWFsbHkgYXMgcGVyIEVDTUEtMjYyIDZ0aCBFZGl0aW9uLFxuICAvLyBTZWN0aW9uIDEzLjMuMy43IFJ1bnRpbWUgU2VtYW50aWNzOiBLZXllZEJpbmRpbmdJbml0aWFsaXphdGlvbi5cbiAgaWYgKHN0YXJ0ID09PSB1bmRlZmluZWQgfHwgc3RhcnQgPCAwKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgLy8gUmV0dXJuIGVhcmx5IGlmIHN0YXJ0ID4gdGhpcy5sZW5ndGguIERvbmUgaGVyZSB0byBwcmV2ZW50IHBvdGVudGlhbCB1aW50MzJcbiAgLy8gY29lcmNpb24gZmFpbCBiZWxvdy5cbiAgaWYgKHN0YXJ0ID4gdGhpcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIGlmIChlbmQgPT09IHVuZGVmaW5lZCB8fCBlbmQgPiB0aGlzLmxlbmd0aCkge1xuICAgIGVuZCA9IHRoaXMubGVuZ3RoXG4gIH1cblxuICBpZiAoZW5kIDw9IDApIHtcbiAgICByZXR1cm4gJydcbiAgfVxuXG4gIC8vIEZvcmNlIGNvZXJzaW9uIHRvIHVpbnQzMi4gVGhpcyB3aWxsIGFsc28gY29lcmNlIGZhbHNleS9OYU4gdmFsdWVzIHRvIDAuXG4gIGVuZCA+Pj49IDBcbiAgc3RhcnQgPj4+PSAwXG5cbiAgaWYgKGVuZCA8PSBzdGFydCkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgaWYgKCFlbmNvZGluZykgZW5jb2RpbmcgPSAndXRmOCdcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhTbGljZSh0aGlzLCBzdGFydCwgZW5kKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgcmV0dXJuIGJhc2U2NFNsaWNlKHRoaXMsIHN0YXJ0LCBlbmQpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1dGYxNmxlU2xpY2UodGhpcywgc3RhcnQsIGVuZClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKGVuY29kaW5nICsgJycpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbi8vIFRoaXMgcHJvcGVydHkgaXMgdXNlZCBieSBgQnVmZmVyLmlzQnVmZmVyYCAoYW5kIHRoZSBgaXMtYnVmZmVyYCBucG0gcGFja2FnZSlcbi8vIHRvIGRldGVjdCBhIEJ1ZmZlciBpbnN0YW5jZS4gSXQncyBub3QgcG9zc2libGUgdG8gdXNlIGBpbnN0YW5jZW9mIEJ1ZmZlcmBcbi8vIHJlbGlhYmx5IGluIGEgYnJvd3NlcmlmeSBjb250ZXh0IGJlY2F1c2UgdGhlcmUgY291bGQgYmUgbXVsdGlwbGUgZGlmZmVyZW50XG4vLyBjb3BpZXMgb2YgdGhlICdidWZmZXInIHBhY2thZ2UgaW4gdXNlLiBUaGlzIG1ldGhvZCB3b3JrcyBldmVuIGZvciBCdWZmZXJcbi8vIGluc3RhbmNlcyB0aGF0IHdlcmUgY3JlYXRlZCBmcm9tIGFub3RoZXIgY29weSBvZiB0aGUgYGJ1ZmZlcmAgcGFja2FnZS5cbi8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL2Zlcm9zcy9idWZmZXIvaXNzdWVzLzE1NFxuQnVmZmVyLnByb3RvdHlwZS5faXNCdWZmZXIgPSB0cnVlXG5cbmZ1bmN0aW9uIHN3YXAgKGIsIG4sIG0pIHtcbiAgdmFyIGkgPSBiW25dXG4gIGJbbl0gPSBiW21dXG4gIGJbbV0gPSBpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuc3dhcDE2ID0gZnVuY3Rpb24gc3dhcDE2ICgpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIGlmIChsZW4gJSAyICE9PSAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0J1ZmZlciBzaXplIG11c3QgYmUgYSBtdWx0aXBsZSBvZiAxNi1iaXRzJylcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSArPSAyKSB7XG4gICAgc3dhcCh0aGlzLCBpLCBpICsgMSlcbiAgfVxuICByZXR1cm4gdGhpc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnN3YXAzMiA9IGZ1bmN0aW9uIHN3YXAzMiAoKSB7XG4gIHZhciBsZW4gPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuICUgNCAhPT0gMCkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdCdWZmZXIgc2l6ZSBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgMzItYml0cycpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgIHN3YXAodGhpcywgaSwgaSArIDMpXG4gICAgc3dhcCh0aGlzLCBpICsgMSwgaSArIDIpXG4gIH1cbiAgcmV0dXJuIHRoaXNcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5zd2FwNjQgPSBmdW5jdGlvbiBzd2FwNjQgKCkge1xuICB2YXIgbGVuID0gdGhpcy5sZW5ndGhcbiAgaWYgKGxlbiAlIDggIT09IDApIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignQnVmZmVyIHNpemUgbXVzdCBiZSBhIG11bHRpcGxlIG9mIDY0LWJpdHMnKVxuICB9XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpICs9IDgpIHtcbiAgICBzd2FwKHRoaXMsIGksIGkgKyA3KVxuICAgIHN3YXAodGhpcywgaSArIDEsIGkgKyA2KVxuICAgIHN3YXAodGhpcywgaSArIDIsIGkgKyA1KVxuICAgIHN3YXAodGhpcywgaSArIDMsIGkgKyA0KVxuICB9XG4gIHJldHVybiB0aGlzXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbiB0b1N0cmluZyAoKSB7XG4gIHZhciBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICBpZiAobGVuZ3RoID09PSAwKSByZXR1cm4gJydcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiB1dGY4U2xpY2UodGhpcywgMCwgbGVuZ3RoKVxuICByZXR1cm4gc2xvd1RvU3RyaW5nLmFwcGx5KHRoaXMsIGFyZ3VtZW50cylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS50b0xvY2FsZVN0cmluZyA9IEJ1ZmZlci5wcm90b3R5cGUudG9TdHJpbmdcblxuQnVmZmVyLnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbiBlcXVhbHMgKGIpIHtcbiAgaWYgKCFCdWZmZXIuaXNCdWZmZXIoYikpIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXInKVxuICBpZiAodGhpcyA9PT0gYikgcmV0dXJuIHRydWVcbiAgcmV0dXJuIEJ1ZmZlci5jb21wYXJlKHRoaXMsIGIpID09PSAwXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5zcGVjdCA9IGZ1bmN0aW9uIGluc3BlY3QgKCkge1xuICB2YXIgc3RyID0gJydcbiAgdmFyIG1heCA9IGV4cG9ydHMuSU5TUEVDVF9NQVhfQllURVNcbiAgc3RyID0gdGhpcy50b1N0cmluZygnaGV4JywgMCwgbWF4KS5yZXBsYWNlKC8oLnsyfSkvZywgJyQxICcpLnRyaW0oKVxuICBpZiAodGhpcy5sZW5ndGggPiBtYXgpIHN0ciArPSAnIC4uLiAnXG4gIHJldHVybiAnPEJ1ZmZlciAnICsgc3RyICsgJz4nXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuY29tcGFyZSA9IGZ1bmN0aW9uIGNvbXBhcmUgKHRhcmdldCwgc3RhcnQsIGVuZCwgdGhpc1N0YXJ0LCB0aGlzRW5kKSB7XG4gIGlmIChpc0luc3RhbmNlKHRhcmdldCwgVWludDhBcnJheSkpIHtcbiAgICB0YXJnZXQgPSBCdWZmZXIuZnJvbSh0YXJnZXQsIHRhcmdldC5vZmZzZXQsIHRhcmdldC5ieXRlTGVuZ3RoKVxuICB9XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgJ1RoZSBcInRhcmdldFwiIGFyZ3VtZW50IG11c3QgYmUgb25lIG9mIHR5cGUgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuICcgK1xuICAgICAgJ1JlY2VpdmVkIHR5cGUgJyArICh0eXBlb2YgdGFyZ2V0KVxuICAgIClcbiAgfVxuXG4gIGlmIChzdGFydCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgc3RhcnQgPSAwXG4gIH1cbiAgaWYgKGVuZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5kID0gdGFyZ2V0ID8gdGFyZ2V0Lmxlbmd0aCA6IDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID09PSB1bmRlZmluZWQpIHtcbiAgICB0aGlzU3RhcnQgPSAwXG4gIH1cbiAgaWYgKHRoaXNFbmQgPT09IHVuZGVmaW5lZCkge1xuICAgIHRoaXNFbmQgPSB0aGlzLmxlbmd0aFxuICB9XG5cbiAgaWYgKHN0YXJ0IDwgMCB8fCBlbmQgPiB0YXJnZXQubGVuZ3RoIHx8IHRoaXNTdGFydCA8IDAgfHwgdGhpc0VuZCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ291dCBvZiByYW5nZSBpbmRleCcpXG4gIH1cblxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQgJiYgc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDBcbiAgfVxuICBpZiAodGhpc1N0YXJ0ID49IHRoaXNFbmQpIHtcbiAgICByZXR1cm4gLTFcbiAgfVxuICBpZiAoc3RhcnQgPj0gZW5kKSB7XG4gICAgcmV0dXJuIDFcbiAgfVxuXG4gIHN0YXJ0ID4+Pj0gMFxuICBlbmQgPj4+PSAwXG4gIHRoaXNTdGFydCA+Pj49IDBcbiAgdGhpc0VuZCA+Pj49IDBcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0KSByZXR1cm4gMFxuXG4gIHZhciB4ID0gdGhpc0VuZCAtIHRoaXNTdGFydFxuICB2YXIgeSA9IGVuZCAtIHN0YXJ0XG4gIHZhciBsZW4gPSBNYXRoLm1pbih4LCB5KVxuXG4gIHZhciB0aGlzQ29weSA9IHRoaXMuc2xpY2UodGhpc1N0YXJ0LCB0aGlzRW5kKVxuICB2YXIgdGFyZ2V0Q29weSA9IHRhcmdldC5zbGljZShzdGFydCwgZW5kKVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAodGhpc0NvcHlbaV0gIT09IHRhcmdldENvcHlbaV0pIHtcbiAgICAgIHggPSB0aGlzQ29weVtpXVxuICAgICAgeSA9IHRhcmdldENvcHlbaV1cbiAgICAgIGJyZWFrXG4gICAgfVxuICB9XG5cbiAgaWYgKHggPCB5KSByZXR1cm4gLTFcbiAgaWYgKHkgPCB4KSByZXR1cm4gMVxuICByZXR1cm4gMFxufVxuXG4vLyBGaW5kcyBlaXRoZXIgdGhlIGZpcnN0IGluZGV4IG9mIGB2YWxgIGluIGBidWZmZXJgIGF0IG9mZnNldCA+PSBgYnl0ZU9mZnNldGAsXG4vLyBPUiB0aGUgbGFzdCBpbmRleCBvZiBgdmFsYCBpbiBgYnVmZmVyYCBhdCBvZmZzZXQgPD0gYGJ5dGVPZmZzZXRgLlxuLy9cbi8vIEFyZ3VtZW50czpcbi8vIC0gYnVmZmVyIC0gYSBCdWZmZXIgdG8gc2VhcmNoXG4vLyAtIHZhbCAtIGEgc3RyaW5nLCBCdWZmZXIsIG9yIG51bWJlclxuLy8gLSBieXRlT2Zmc2V0IC0gYW4gaW5kZXggaW50byBgYnVmZmVyYDsgd2lsbCBiZSBjbGFtcGVkIHRvIGFuIGludDMyXG4vLyAtIGVuY29kaW5nIC0gYW4gb3B0aW9uYWwgZW5jb2RpbmcsIHJlbGV2YW50IGlzIHZhbCBpcyBhIHN0cmluZ1xuLy8gLSBkaXIgLSB0cnVlIGZvciBpbmRleE9mLCBmYWxzZSBmb3IgbGFzdEluZGV4T2ZcbmZ1bmN0aW9uIGJpZGlyZWN0aW9uYWxJbmRleE9mIChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcikge1xuICAvLyBFbXB0eSBidWZmZXIgbWVhbnMgbm8gbWF0Y2hcbiAgaWYgKGJ1ZmZlci5sZW5ndGggPT09IDApIHJldHVybiAtMVxuXG4gIC8vIE5vcm1hbGl6ZSBieXRlT2Zmc2V0XG4gIGlmICh0eXBlb2YgYnl0ZU9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IGJ5dGVPZmZzZXRcbiAgICBieXRlT2Zmc2V0ID0gMFxuICB9IGVsc2UgaWYgKGJ5dGVPZmZzZXQgPiAweDdmZmZmZmZmKSB7XG4gICAgYnl0ZU9mZnNldCA9IDB4N2ZmZmZmZmZcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgLTB4ODAwMDAwMDApIHtcbiAgICBieXRlT2Zmc2V0ID0gLTB4ODAwMDAwMDBcbiAgfVxuICBieXRlT2Zmc2V0ID0gK2J5dGVPZmZzZXQgLy8gQ29lcmNlIHRvIE51bWJlci5cbiAgaWYgKG51bWJlcklzTmFOKGJ5dGVPZmZzZXQpKSB7XG4gICAgLy8gYnl0ZU9mZnNldDogaXQgaXQncyB1bmRlZmluZWQsIG51bGwsIE5hTiwgXCJmb29cIiwgZXRjLCBzZWFyY2ggd2hvbGUgYnVmZmVyXG4gICAgYnl0ZU9mZnNldCA9IGRpciA/IDAgOiAoYnVmZmVyLmxlbmd0aCAtIDEpXG4gIH1cblxuICAvLyBOb3JtYWxpemUgYnl0ZU9mZnNldDogbmVnYXRpdmUgb2Zmc2V0cyBzdGFydCBmcm9tIHRoZSBlbmQgb2YgdGhlIGJ1ZmZlclxuICBpZiAoYnl0ZU9mZnNldCA8IDApIGJ5dGVPZmZzZXQgPSBidWZmZXIubGVuZ3RoICsgYnl0ZU9mZnNldFxuICBpZiAoYnl0ZU9mZnNldCA+PSBidWZmZXIubGVuZ3RoKSB7XG4gICAgaWYgKGRpcikgcmV0dXJuIC0xXG4gICAgZWxzZSBieXRlT2Zmc2V0ID0gYnVmZmVyLmxlbmd0aCAtIDFcbiAgfSBlbHNlIGlmIChieXRlT2Zmc2V0IDwgMCkge1xuICAgIGlmIChkaXIpIGJ5dGVPZmZzZXQgPSAwXG4gICAgZWxzZSByZXR1cm4gLTFcbiAgfVxuXG4gIC8vIE5vcm1hbGl6ZSB2YWxcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gQnVmZmVyLmZyb20odmFsLCBlbmNvZGluZylcbiAgfVxuXG4gIC8vIEZpbmFsbHksIHNlYXJjaCBlaXRoZXIgaW5kZXhPZiAoaWYgZGlyIGlzIHRydWUpIG9yIGxhc3RJbmRleE9mXG4gIGlmIChCdWZmZXIuaXNCdWZmZXIodmFsKSkge1xuICAgIC8vIFNwZWNpYWwgY2FzZTogbG9va2luZyBmb3IgZW1wdHkgc3RyaW5nL2J1ZmZlciBhbHdheXMgZmFpbHNcbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIC0xXG4gICAgfVxuICAgIHJldHVybiBhcnJheUluZGV4T2YoYnVmZmVyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpXG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAweEZGIC8vIFNlYXJjaCBmb3IgYSBieXRlIHZhbHVlIFswLTI1NV1cbiAgICBpZiAodHlwZW9mIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmIChkaXIpIHtcbiAgICAgICAgcmV0dXJuIFVpbnQ4QXJyYXkucHJvdG90eXBlLmluZGV4T2YuY2FsbChidWZmZXIsIHZhbCwgYnl0ZU9mZnNldClcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBVaW50OEFycmF5LnByb3RvdHlwZS5sYXN0SW5kZXhPZi5jYWxsKGJ1ZmZlciwgdmFsLCBieXRlT2Zmc2V0KVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gYXJyYXlJbmRleE9mKGJ1ZmZlciwgWyB2YWwgXSwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGRpcilcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ZhbCBtdXN0IGJlIHN0cmluZywgbnVtYmVyIG9yIEJ1ZmZlcicpXG59XG5cbmZ1bmN0aW9uIGFycmF5SW5kZXhPZiAoYXJyLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCBkaXIpIHtcbiAgdmFyIGluZGV4U2l6ZSA9IDFcbiAgdmFyIGFyckxlbmd0aCA9IGFyci5sZW5ndGhcbiAgdmFyIHZhbExlbmd0aCA9IHZhbC5sZW5ndGhcblxuICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCkge1xuICAgIGVuY29kaW5nID0gU3RyaW5nKGVuY29kaW5nKS50b0xvd2VyQ2FzZSgpXG4gICAgaWYgKGVuY29kaW5nID09PSAndWNzMicgfHwgZW5jb2RpbmcgPT09ICd1Y3MtMicgfHxcbiAgICAgICAgZW5jb2RpbmcgPT09ICd1dGYxNmxlJyB8fCBlbmNvZGluZyA9PT0gJ3V0Zi0xNmxlJykge1xuICAgICAgaWYgKGFyci5sZW5ndGggPCAyIHx8IHZhbC5sZW5ndGggPCAyKSB7XG4gICAgICAgIHJldHVybiAtMVxuICAgICAgfVxuICAgICAgaW5kZXhTaXplID0gMlxuICAgICAgYXJyTGVuZ3RoIC89IDJcbiAgICAgIHZhbExlbmd0aCAvPSAyXG4gICAgICBieXRlT2Zmc2V0IC89IDJcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkIChidWYsIGkpIHtcbiAgICBpZiAoaW5kZXhTaXplID09PSAxKSB7XG4gICAgICByZXR1cm4gYnVmW2ldXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBidWYucmVhZFVJbnQxNkJFKGkgKiBpbmRleFNpemUpXG4gICAgfVxuICB9XG5cbiAgdmFyIGlcbiAgaWYgKGRpcikge1xuICAgIHZhciBmb3VuZEluZGV4ID0gLTFcbiAgICBmb3IgKGkgPSBieXRlT2Zmc2V0OyBpIDwgYXJyTGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWFkKGFyciwgaSkgPT09IHJlYWQodmFsLCBmb3VuZEluZGV4ID09PSAtMSA/IDAgOiBpIC0gZm91bmRJbmRleCkpIHtcbiAgICAgICAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSBmb3VuZEluZGV4ID0gaVxuICAgICAgICBpZiAoaSAtIGZvdW5kSW5kZXggKyAxID09PSB2YWxMZW5ndGgpIHJldHVybiBmb3VuZEluZGV4ICogaW5kZXhTaXplXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoZm91bmRJbmRleCAhPT0gLTEpIGkgLT0gaSAtIGZvdW5kSW5kZXhcbiAgICAgICAgZm91bmRJbmRleCA9IC0xXG4gICAgICB9XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChieXRlT2Zmc2V0ICsgdmFsTGVuZ3RoID4gYXJyTGVuZ3RoKSBieXRlT2Zmc2V0ID0gYXJyTGVuZ3RoIC0gdmFsTGVuZ3RoXG4gICAgZm9yIChpID0gYnl0ZU9mZnNldDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciBmb3VuZCA9IHRydWVcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlYWQoYXJyLCBpICsgaikgIT09IHJlYWQodmFsLCBqKSkge1xuICAgICAgICAgIGZvdW5kID0gZmFsc2VcbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoZm91bmQpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIC0xXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbiBpbmNsdWRlcyAodmFsLCBieXRlT2Zmc2V0LCBlbmNvZGluZykge1xuICByZXR1cm4gdGhpcy5pbmRleE9mKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpICE9PSAtMVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbiBpbmRleE9mICh2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nKSB7XG4gIHJldHVybiBiaWRpcmVjdGlvbmFsSW5kZXhPZih0aGlzLCB2YWwsIGJ5dGVPZmZzZXQsIGVuY29kaW5nLCB0cnVlKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24gbGFzdEluZGV4T2YgKHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcpIHtcbiAgcmV0dXJuIGJpZGlyZWN0aW9uYWxJbmRleE9mKHRoaXMsIHZhbCwgYnl0ZU9mZnNldCwgZW5jb2RpbmcsIGZhbHNlKVxufVxuXG5mdW5jdGlvbiBoZXhXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIG9mZnNldCA9IE51bWJlcihvZmZzZXQpIHx8IDBcbiAgdmFyIHJlbWFpbmluZyA9IGJ1Zi5sZW5ndGggLSBvZmZzZXRcbiAgaWYgKCFsZW5ndGgpIHtcbiAgICBsZW5ndGggPSByZW1haW5pbmdcbiAgfSBlbHNlIHtcbiAgICBsZW5ndGggPSBOdW1iZXIobGVuZ3RoKVxuICAgIGlmIChsZW5ndGggPiByZW1haW5pbmcpIHtcbiAgICAgIGxlbmd0aCA9IHJlbWFpbmluZ1xuICAgIH1cbiAgfVxuXG4gIHZhciBzdHJMZW4gPSBzdHJpbmcubGVuZ3RoXG5cbiAgaWYgKGxlbmd0aCA+IHN0ckxlbiAvIDIpIHtcbiAgICBsZW5ndGggPSBzdHJMZW4gLyAyXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIHZhciBwYXJzZWQgPSBwYXJzZUludChzdHJpbmcuc3Vic3RyKGkgKiAyLCAyKSwgMTYpXG4gICAgaWYgKG51bWJlcklzTmFOKHBhcnNlZCkpIHJldHVybiBpXG4gICAgYnVmW29mZnNldCArIGldID0gcGFyc2VkXG4gIH1cbiAgcmV0dXJuIGlcbn1cblxuZnVuY3Rpb24gdXRmOFdyaXRlIChidWYsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgcmV0dXJuIGJsaXRCdWZmZXIodXRmOFRvQnl0ZXMoc3RyaW5nLCBidWYubGVuZ3RoIC0gb2Zmc2V0KSwgYnVmLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYXNjaWlXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKGFzY2lpVG9CeXRlcyhzdHJpbmcpLCBidWYsIG9mZnNldCwgbGVuZ3RoKVxufVxuXG5mdW5jdGlvbiBsYXRpbjFXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBhc2NpaVdyaXRlKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcbn1cblxuZnVuY3Rpb24gYmFzZTY0V3JpdGUgKGJ1Ziwgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCkge1xuICByZXR1cm4gYmxpdEJ1ZmZlcihiYXNlNjRUb0J5dGVzKHN0cmluZyksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbmZ1bmN0aW9uIHVjczJXcml0ZSAoYnVmLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKSB7XG4gIHJldHVybiBibGl0QnVmZmVyKHV0ZjE2bGVUb0J5dGVzKHN0cmluZywgYnVmLmxlbmd0aCAtIG9mZnNldCksIGJ1Ziwgb2Zmc2V0LCBsZW5ndGgpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiB3cml0ZSAoc3RyaW5nLCBvZmZzZXQsIGxlbmd0aCwgZW5jb2RpbmcpIHtcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZylcbiAgaWYgKG9mZnNldCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgZW5jb2RpbmcgPSAndXRmOCdcbiAgICBsZW5ndGggPSB0aGlzLmxlbmd0aFxuICAgIG9mZnNldCA9IDBcbiAgLy8gQnVmZmVyI3dyaXRlKHN0cmluZywgZW5jb2RpbmcpXG4gIH0gZWxzZSBpZiAobGVuZ3RoID09PSB1bmRlZmluZWQgJiYgdHlwZW9mIG9mZnNldCA9PT0gJ3N0cmluZycpIHtcbiAgICBlbmNvZGluZyA9IG9mZnNldFxuICAgIGxlbmd0aCA9IHRoaXMubGVuZ3RoXG4gICAgb2Zmc2V0ID0gMFxuICAvLyBCdWZmZXIjd3JpdGUoc3RyaW5nLCBvZmZzZXRbLCBsZW5ndGhdWywgZW5jb2RpbmddKVxuICB9IGVsc2UgaWYgKGlzRmluaXRlKG9mZnNldCkpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgICBpZiAoaXNGaW5pdGUobGVuZ3RoKSkge1xuICAgICAgbGVuZ3RoID0gbGVuZ3RoID4+PiAwXG4gICAgICBpZiAoZW5jb2RpbmcgPT09IHVuZGVmaW5lZCkgZW5jb2RpbmcgPSAndXRmOCdcbiAgICB9IGVsc2Uge1xuICAgICAgZW5jb2RpbmcgPSBsZW5ndGhcbiAgICAgIGxlbmd0aCA9IHVuZGVmaW5lZFxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAnQnVmZmVyLndyaXRlKHN0cmluZywgZW5jb2RpbmcsIG9mZnNldFssIGxlbmd0aF0pIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQnXG4gICAgKVxuICB9XG5cbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMubGVuZ3RoIC0gb2Zmc2V0XG4gIGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCB8fCBsZW5ndGggPiByZW1haW5pbmcpIGxlbmd0aCA9IHJlbWFpbmluZ1xuXG4gIGlmICgoc3RyaW5nLmxlbmd0aCA+IDAgJiYgKGxlbmd0aCA8IDAgfHwgb2Zmc2V0IDwgMCkpIHx8IG9mZnNldCA+IHRoaXMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0F0dGVtcHQgdG8gd3JpdGUgb3V0c2lkZSBidWZmZXIgYm91bmRzJylcbiAgfVxuXG4gIGlmICghZW5jb2RpbmcpIGVuY29kaW5nID0gJ3V0ZjgnXG5cbiAgdmFyIGxvd2VyZWRDYXNlID0gZmFsc2VcbiAgZm9yICg7Oykge1xuICAgIHN3aXRjaCAoZW5jb2RpbmcpIHtcbiAgICAgIGNhc2UgJ2hleCc6XG4gICAgICAgIHJldHVybiBoZXhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICd1dGY4JzpcbiAgICAgIGNhc2UgJ3V0Zi04JzpcbiAgICAgICAgcmV0dXJuIHV0ZjhXcml0ZSh0aGlzLCBzdHJpbmcsIG9mZnNldCwgbGVuZ3RoKVxuXG4gICAgICBjYXNlICdhc2NpaSc6XG4gICAgICAgIHJldHVybiBhc2NpaVdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ2xhdGluMSc6XG4gICAgICBjYXNlICdiaW5hcnknOlxuICAgICAgICByZXR1cm4gbGF0aW4xV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgY2FzZSAnYmFzZTY0JzpcbiAgICAgICAgLy8gV2FybmluZzogbWF4TGVuZ3RoIG5vdCB0YWtlbiBpbnRvIGFjY291bnQgaW4gYmFzZTY0V3JpdGVcbiAgICAgICAgcmV0dXJuIGJhc2U2NFdyaXRlKHRoaXMsIHN0cmluZywgb2Zmc2V0LCBsZW5ndGgpXG5cbiAgICAgIGNhc2UgJ3VjczInOlxuICAgICAgY2FzZSAndWNzLTInOlxuICAgICAgY2FzZSAndXRmMTZsZSc6XG4gICAgICBjYXNlICd1dGYtMTZsZSc6XG4gICAgICAgIHJldHVybiB1Y3MyV3JpdGUodGhpcywgc3RyaW5nLCBvZmZzZXQsIGxlbmd0aClcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKGxvd2VyZWRDYXNlKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdVbmtub3duIGVuY29kaW5nOiAnICsgZW5jb2RpbmcpXG4gICAgICAgIGVuY29kaW5nID0gKCcnICsgZW5jb2RpbmcpLnRvTG93ZXJDYXNlKClcbiAgICAgICAgbG93ZXJlZENhc2UgPSB0cnVlXG4gICAgfVxuICB9XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gdG9KU09OICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiAnQnVmZmVyJyxcbiAgICBkYXRhOiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCh0aGlzLl9hcnIgfHwgdGhpcywgMClcbiAgfVxufVxuXG5mdW5jdGlvbiBiYXNlNjRTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIGlmIChzdGFydCA9PT0gMCAmJiBlbmQgPT09IGJ1Zi5sZW5ndGgpIHtcbiAgICByZXR1cm4gYmFzZTY0LmZyb21CeXRlQXJyYXkoYnVmKVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBiYXNlNjQuZnJvbUJ5dGVBcnJheShidWYuc2xpY2Uoc3RhcnQsIGVuZCkpXG4gIH1cbn1cblxuZnVuY3Rpb24gdXRmOFNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgZW5kID0gTWF0aC5taW4oYnVmLmxlbmd0aCwgZW5kKVxuICB2YXIgcmVzID0gW11cblxuICB2YXIgaSA9IHN0YXJ0XG4gIHdoaWxlIChpIDwgZW5kKSB7XG4gICAgdmFyIGZpcnN0Qnl0ZSA9IGJ1ZltpXVxuICAgIHZhciBjb2RlUG9pbnQgPSBudWxsXG4gICAgdmFyIGJ5dGVzUGVyU2VxdWVuY2UgPSAoZmlyc3RCeXRlID4gMHhFRikgPyA0XG4gICAgICA6IChmaXJzdEJ5dGUgPiAweERGKSA/IDNcbiAgICAgICAgOiAoZmlyc3RCeXRlID4gMHhCRikgPyAyXG4gICAgICAgICAgOiAxXG5cbiAgICBpZiAoaSArIGJ5dGVzUGVyU2VxdWVuY2UgPD0gZW5kKSB7XG4gICAgICB2YXIgc2Vjb25kQnl0ZSwgdGhpcmRCeXRlLCBmb3VydGhCeXRlLCB0ZW1wQ29kZVBvaW50XG5cbiAgICAgIHN3aXRjaCAoYnl0ZXNQZXJTZXF1ZW5jZSkge1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgaWYgKGZpcnN0Qnl0ZSA8IDB4ODApIHtcbiAgICAgICAgICAgIGNvZGVQb2ludCA9IGZpcnN0Qnl0ZVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweDFGKSA8PCAweDYgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4N0YpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgaWYgKChzZWNvbmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKHRoaXJkQnl0ZSAmIDB4QzApID09PSAweDgwKSB7XG4gICAgICAgICAgICB0ZW1wQ29kZVBvaW50ID0gKGZpcnN0Qnl0ZSAmIDB4RikgPDwgMHhDIHwgKHNlY29uZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAodGhpcmRCeXRlICYgMHgzRilcbiAgICAgICAgICAgIGlmICh0ZW1wQ29kZVBvaW50ID4gMHg3RkYgJiYgKHRlbXBDb2RlUG9pbnQgPCAweEQ4MDAgfHwgdGVtcENvZGVQb2ludCA+IDB4REZGRikpIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBicmVha1xuICAgICAgICBjYXNlIDQ6XG4gICAgICAgICAgc2Vjb25kQnl0ZSA9IGJ1ZltpICsgMV1cbiAgICAgICAgICB0aGlyZEJ5dGUgPSBidWZbaSArIDJdXG4gICAgICAgICAgZm91cnRoQnl0ZSA9IGJ1ZltpICsgM11cbiAgICAgICAgICBpZiAoKHNlY29uZEJ5dGUgJiAweEMwKSA9PT0gMHg4MCAmJiAodGhpcmRCeXRlICYgMHhDMCkgPT09IDB4ODAgJiYgKGZvdXJ0aEJ5dGUgJiAweEMwKSA9PT0gMHg4MCkge1xuICAgICAgICAgICAgdGVtcENvZGVQb2ludCA9IChmaXJzdEJ5dGUgJiAweEYpIDw8IDB4MTIgfCAoc2Vjb25kQnl0ZSAmIDB4M0YpIDw8IDB4QyB8ICh0aGlyZEJ5dGUgJiAweDNGKSA8PCAweDYgfCAoZm91cnRoQnl0ZSAmIDB4M0YpXG4gICAgICAgICAgICBpZiAodGVtcENvZGVQb2ludCA+IDB4RkZGRiAmJiB0ZW1wQ29kZVBvaW50IDwgMHgxMTAwMDApIHtcbiAgICAgICAgICAgICAgY29kZVBvaW50ID0gdGVtcENvZGVQb2ludFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoY29kZVBvaW50ID09PSBudWxsKSB7XG4gICAgICAvLyB3ZSBkaWQgbm90IGdlbmVyYXRlIGEgdmFsaWQgY29kZVBvaW50IHNvIGluc2VydCBhXG4gICAgICAvLyByZXBsYWNlbWVudCBjaGFyIChVK0ZGRkQpIGFuZCBhZHZhbmNlIG9ubHkgMSBieXRlXG4gICAgICBjb2RlUG9pbnQgPSAweEZGRkRcbiAgICAgIGJ5dGVzUGVyU2VxdWVuY2UgPSAxXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPiAweEZGRkYpIHtcbiAgICAgIC8vIGVuY29kZSB0byB1dGYxNiAoc3Vycm9nYXRlIHBhaXIgZGFuY2UpXG4gICAgICBjb2RlUG9pbnQgLT0gMHgxMDAwMFxuICAgICAgcmVzLnB1c2goY29kZVBvaW50ID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKVxuICAgICAgY29kZVBvaW50ID0gMHhEQzAwIHwgY29kZVBvaW50ICYgMHgzRkZcbiAgICB9XG5cbiAgICByZXMucHVzaChjb2RlUG9pbnQpXG4gICAgaSArPSBieXRlc1BlclNlcXVlbmNlXG4gIH1cblxuICByZXR1cm4gZGVjb2RlQ29kZVBvaW50c0FycmF5KHJlcylcbn1cblxuLy8gQmFzZWQgb24gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMjI3NDcyNzIvNjgwNzQyLCB0aGUgYnJvd3NlciB3aXRoXG4vLyB0aGUgbG93ZXN0IGxpbWl0IGlzIENocm9tZSwgd2l0aCAweDEwMDAwIGFyZ3MuXG4vLyBXZSBnbyAxIG1hZ25pdHVkZSBsZXNzLCBmb3Igc2FmZXR5XG52YXIgTUFYX0FSR1VNRU5UU19MRU5HVEggPSAweDEwMDBcblxuZnVuY3Rpb24gZGVjb2RlQ29kZVBvaW50c0FycmF5IChjb2RlUG9pbnRzKSB7XG4gIHZhciBsZW4gPSBjb2RlUG9pbnRzLmxlbmd0aFxuICBpZiAobGVuIDw9IE1BWF9BUkdVTUVOVFNfTEVOR1RIKSB7XG4gICAgcmV0dXJuIFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkoU3RyaW5nLCBjb2RlUG9pbnRzKSAvLyBhdm9pZCBleHRyYSBzbGljZSgpXG4gIH1cblxuICAvLyBEZWNvZGUgaW4gY2h1bmtzIHRvIGF2b2lkIFwiY2FsbCBzdGFjayBzaXplIGV4Y2VlZGVkXCIuXG4gIHZhciByZXMgPSAnJ1xuICB2YXIgaSA9IDBcbiAgd2hpbGUgKGkgPCBsZW4pIHtcbiAgICByZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShcbiAgICAgIFN0cmluZyxcbiAgICAgIGNvZGVQb2ludHMuc2xpY2UoaSwgaSArPSBNQVhfQVJHVU1FTlRTX0xFTkdUSClcbiAgICApXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5mdW5jdGlvbiBhc2NpaVNsaWNlIChidWYsIHN0YXJ0LCBlbmQpIHtcbiAgdmFyIHJldCA9ICcnXG4gIGVuZCA9IE1hdGgubWluKGJ1Zi5sZW5ndGgsIGVuZClcblxuICBmb3IgKHZhciBpID0gc3RhcnQ7IGkgPCBlbmQ7ICsraSkge1xuICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ1ZltpXSAmIDB4N0YpXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBsYXRpbjFTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciByZXQgPSAnJ1xuICBlbmQgPSBNYXRoLm1pbihidWYubGVuZ3RoLCBlbmQpXG5cbiAgZm9yICh2YXIgaSA9IHN0YXJ0OyBpIDwgZW5kOyArK2kpIHtcbiAgICByZXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShidWZbaV0pXG4gIH1cbiAgcmV0dXJuIHJldFxufVxuXG5mdW5jdGlvbiBoZXhTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBsZW4gPSBidWYubGVuZ3RoXG5cbiAgaWYgKCFzdGFydCB8fCBzdGFydCA8IDApIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCB8fCBlbmQgPCAwIHx8IGVuZCA+IGxlbikgZW5kID0gbGVuXG5cbiAgdmFyIG91dCA9ICcnXG4gIGZvciAodmFyIGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgb3V0ICs9IHRvSGV4KGJ1ZltpXSlcbiAgfVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVTbGljZSAoYnVmLCBzdGFydCwgZW5kKSB7XG4gIHZhciBieXRlcyA9IGJ1Zi5zbGljZShzdGFydCwgZW5kKVxuICB2YXIgcmVzID0gJydcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldICsgKGJ5dGVzW2kgKyAxXSAqIDI1NikpXG4gIH1cbiAgcmV0dXJuIHJlc1xufVxuXG5CdWZmZXIucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gc2xpY2UgKHN0YXJ0LCBlbmQpIHtcbiAgdmFyIGxlbiA9IHRoaXMubGVuZ3RoXG4gIHN0YXJ0ID0gfn5zdGFydFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IGxlbiA6IH5+ZW5kXG5cbiAgaWYgKHN0YXJ0IDwgMCkge1xuICAgIHN0YXJ0ICs9IGxlblxuICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gMFxuICB9IGVsc2UgaWYgKHN0YXJ0ID4gbGVuKSB7XG4gICAgc3RhcnQgPSBsZW5cbiAgfVxuXG4gIGlmIChlbmQgPCAwKSB7XG4gICAgZW5kICs9IGxlblxuICAgIGlmIChlbmQgPCAwKSBlbmQgPSAwXG4gIH0gZWxzZSBpZiAoZW5kID4gbGVuKSB7XG4gICAgZW5kID0gbGVuXG4gIH1cblxuICBpZiAoZW5kIDwgc3RhcnQpIGVuZCA9IHN0YXJ0XG5cbiAgdmFyIG5ld0J1ZiA9IHRoaXMuc3ViYXJyYXkoc3RhcnQsIGVuZClcbiAgLy8gUmV0dXJuIGFuIGF1Z21lbnRlZCBgVWludDhBcnJheWAgaW5zdGFuY2VcbiAgbmV3QnVmLl9fcHJvdG9fXyA9IEJ1ZmZlci5wcm90b3R5cGVcbiAgcmV0dXJuIG5ld0J1ZlxufVxuXG4vKlxuICogTmVlZCB0byBtYWtlIHN1cmUgdGhhdCBidWZmZXIgaXNuJ3QgdHJ5aW5nIHRvIHdyaXRlIG91dCBvZiBib3VuZHMuXG4gKi9cbmZ1bmN0aW9uIGNoZWNrT2Zmc2V0IChvZmZzZXQsIGV4dCwgbGVuZ3RoKSB7XG4gIGlmICgob2Zmc2V0ICUgMSkgIT09IDAgfHwgb2Zmc2V0IDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ29mZnNldCBpcyBub3QgdWludCcpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBsZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdUcnlpbmcgdG8gYWNjZXNzIGJleW9uZCBidWZmZXIgbGVuZ3RoJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludExFID0gZnVuY3Rpb24gcmVhZFVJbnRMRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgdmFsID0gdGhpc1tvZmZzZXRdXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIHZhbCArPSB0aGlzW29mZnNldCArIGldICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnRCRSA9IGZ1bmN0aW9uIHJlYWRVSW50QkUgKG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuICB9XG5cbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1ieXRlTGVuZ3RoXVxuICB2YXIgbXVsID0gMVxuICB3aGlsZSAoYnl0ZUxlbmd0aCA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWJ5dGVMZW5ndGhdICogbXVsXG4gIH1cblxuICByZXR1cm4gdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQ4ID0gZnVuY3Rpb24gcmVhZFVJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQxNkxFID0gZnVuY3Rpb24gcmVhZFVJbnQxNkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDIsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gdGhpc1tvZmZzZXRdIHwgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkVUludDE2QkUgPSBmdW5jdGlvbiByZWFkVUludDE2QkUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiAodGhpc1tvZmZzZXRdIDw8IDgpIHwgdGhpc1tvZmZzZXQgKyAxXVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRVSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRVSW50MzJMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKCh0aGlzW29mZnNldF0pIHxcbiAgICAgICh0aGlzW29mZnNldCArIDFdIDw8IDgpIHxcbiAgICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSkgK1xuICAgICAgKHRoaXNbb2Zmc2V0ICsgM10gKiAweDEwMDAwMDApXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZFVJbnQzMkJFID0gZnVuY3Rpb24gcmVhZFVJbnQzMkJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdICogMHgxMDAwMDAwKSArXG4gICAgKCh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgIHRoaXNbb2Zmc2V0ICsgM10pXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludExFID0gZnVuY3Rpb24gcmVhZEludExFIChvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBieXRlTGVuZ3RoID0gYnl0ZUxlbmd0aCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIGJ5dGVMZW5ndGgsIHRoaXMubGVuZ3RoKVxuXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF1cbiAgdmFyIG11bCA9IDFcbiAgdmFyIGkgPSAwXG4gIHdoaWxlICgrK2kgPCBieXRlTGVuZ3RoICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdmFsICs9IHRoaXNbb2Zmc2V0ICsgaV0gKiBtdWxcbiAgfVxuICBtdWwgKj0gMHg4MFxuXG4gIGlmICh2YWwgPj0gbXVsKSB2YWwgLT0gTWF0aC5wb3coMiwgOCAqIGJ5dGVMZW5ndGgpXG5cbiAgcmV0dXJuIHZhbFxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnRCRSA9IGZ1bmN0aW9uIHJlYWRJbnRCRSAob2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCBieXRlTGVuZ3RoLCB0aGlzLmxlbmd0aClcblxuICB2YXIgaSA9IGJ5dGVMZW5ndGhcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgLS1pXVxuICB3aGlsZSAoaSA+IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB2YWwgKz0gdGhpc1tvZmZzZXQgKyAtLWldICogbXVsXG4gIH1cbiAgbXVsICo9IDB4ODBcblxuICBpZiAodmFsID49IG11bCkgdmFsIC09IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKVxuXG4gIHJldHVybiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50OCA9IGZ1bmN0aW9uIHJlYWRJbnQ4IChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDEsIHRoaXMubGVuZ3RoKVxuICBpZiAoISh0aGlzW29mZnNldF0gJiAweDgwKSkgcmV0dXJuICh0aGlzW29mZnNldF0pXG4gIHJldHVybiAoKDB4ZmYgLSB0aGlzW29mZnNldF0gKyAxKSAqIC0xKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRJbnQxNkxFID0gZnVuY3Rpb24gcmVhZEludDE2TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgMiwgdGhpcy5sZW5ndGgpXG4gIHZhciB2YWwgPSB0aGlzW29mZnNldF0gfCAodGhpc1tvZmZzZXQgKyAxXSA8PCA4KVxuICByZXR1cm4gKHZhbCAmIDB4ODAwMCkgPyB2YWwgfCAweEZGRkYwMDAwIDogdmFsXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDE2QkUgPSBmdW5jdGlvbiByZWFkSW50MTZCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCAyLCB0aGlzLmxlbmd0aClcbiAgdmFyIHZhbCA9IHRoaXNbb2Zmc2V0ICsgMV0gfCAodGhpc1tvZmZzZXRdIDw8IDgpXG4gIHJldHVybiAodmFsICYgMHg4MDAwKSA/IHZhbCB8IDB4RkZGRjAwMDAgOiB2YWxcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50MzJMRSA9IGZ1bmN0aW9uIHJlYWRJbnQzMkxFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuXG4gIHJldHVybiAodGhpc1tvZmZzZXRdKSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMV0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDJdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgM10gPDwgMjQpXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUucmVhZEludDMyQkUgPSBmdW5jdGlvbiByZWFkSW50MzJCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA0LCB0aGlzLmxlbmd0aClcblxuICByZXR1cm4gKHRoaXNbb2Zmc2V0XSA8PCAyNCkgfFxuICAgICh0aGlzW29mZnNldCArIDFdIDw8IDE2KSB8XG4gICAgKHRoaXNbb2Zmc2V0ICsgMl0gPDwgOCkgfFxuICAgICh0aGlzW29mZnNldCArIDNdKVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWRGbG9hdExFID0gZnVuY3Rpb24gcmVhZEZsb2F0TEUgKG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrT2Zmc2V0KG9mZnNldCwgNCwgdGhpcy5sZW5ndGgpXG4gIHJldHVybiBpZWVlNzU0LnJlYWQodGhpcywgb2Zmc2V0LCB0cnVlLCAyMywgNClcbn1cblxuQnVmZmVyLnByb3RvdHlwZS5yZWFkRmxvYXRCRSA9IGZ1bmN0aW9uIHJlYWRGbG9hdEJFIChvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja09mZnNldChvZmZzZXQsIDQsIHRoaXMubGVuZ3RoKVxuICByZXR1cm4gaWVlZTc1NC5yZWFkKHRoaXMsIG9mZnNldCwgZmFsc2UsIDIzLCA0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVMRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVMRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIHRydWUsIDUyLCA4KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLnJlYWREb3VibGVCRSA9IGZ1bmN0aW9uIHJlYWREb3VibGVCRSAob2Zmc2V0LCBub0Fzc2VydCkge1xuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tPZmZzZXQob2Zmc2V0LCA4LCB0aGlzLmxlbmd0aClcbiAgcmV0dXJuIGllZWU3NTQucmVhZCh0aGlzLCBvZmZzZXQsIGZhbHNlLCA1MiwgOClcbn1cblxuZnVuY3Rpb24gY2hlY2tJbnQgKGJ1ZiwgdmFsdWUsIG9mZnNldCwgZXh0LCBtYXgsIG1pbikge1xuICBpZiAoIUJ1ZmZlci5pc0J1ZmZlcihidWYpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdcImJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYSBCdWZmZXIgaW5zdGFuY2UnKVxuICBpZiAodmFsdWUgPiBtYXggfHwgdmFsdWUgPCBtaW4pIHRocm93IG5ldyBSYW5nZUVycm9yKCdcInZhbHVlXCIgYXJndW1lbnQgaXMgb3V0IG9mIGJvdW5kcycpXG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnRMRSA9IGZ1bmN0aW9uIHdyaXRlVUludExFICh2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgYnl0ZUxlbmd0aCA9IGJ5dGVMZW5ndGggPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkge1xuICAgIHZhciBtYXhCeXRlcyA9IE1hdGgucG93KDIsIDggKiBieXRlTGVuZ3RoKSAtIDFcbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBtYXhCeXRlcywgMClcbiAgfVxuXG4gIHZhciBtdWwgPSAxXG4gIHZhciBpID0gMFxuICB0aGlzW29mZnNldF0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKCsraSA8IGJ5dGVMZW5ndGggJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICB0aGlzW29mZnNldCArIGldID0gKHZhbHVlIC8gbXVsKSAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVVSW50QkUgPSBmdW5jdGlvbiB3cml0ZVVJbnRCRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGJ5dGVMZW5ndGggPSBieXRlTGVuZ3RoID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbWF4Qnl0ZXMgPSBNYXRoLnBvdygyLCA4ICogYnl0ZUxlbmd0aCkgLSAxXG4gICAgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbWF4Qnl0ZXMsIDApXG4gIH1cblxuICB2YXIgaSA9IGJ5dGVMZW5ndGggLSAxXG4gIHZhciBtdWwgPSAxXG4gIHRoaXNbb2Zmc2V0ICsgaV0gPSB2YWx1ZSAmIDB4RkZcbiAgd2hpbGUgKC0taSA+PSAwICYmIChtdWwgKj0gMHgxMDApKSB7XG4gICAgdGhpc1tvZmZzZXQgKyBpXSA9ICh2YWx1ZSAvIG11bCkgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlVUludDggPSBmdW5jdGlvbiB3cml0ZVVJbnQ4ICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMSwgMHhmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MTZCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDIsIDB4ZmZmZiwgMClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDJcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkxFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0ICsgM10gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAxXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZVVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVVSW50MzJCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4ZmZmZmZmZmYsIDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDE2KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDNdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludExFID0gZnVuY3Rpb24gd3JpdGVJbnRMRSAodmFsdWUsIG9mZnNldCwgYnl0ZUxlbmd0aCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICB2YXIgbGltaXQgPSBNYXRoLnBvdygyLCAoOCAqIGJ5dGVMZW5ndGgpIC0gMSlcblxuICAgIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIGxpbWl0IC0gMSwgLWxpbWl0KVxuICB9XG5cbiAgdmFyIGkgPSAwXG4gIHZhciBtdWwgPSAxXG4gIHZhciBzdWIgPSAwXG4gIHRoaXNbb2Zmc2V0XSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoKytpIDwgYnl0ZUxlbmd0aCAmJiAobXVsICo9IDB4MTAwKSkge1xuICAgIGlmICh2YWx1ZSA8IDAgJiYgc3ViID09PSAwICYmIHRoaXNbb2Zmc2V0ICsgaSAtIDFdICE9PSAwKSB7XG4gICAgICBzdWIgPSAxXG4gICAgfVxuICAgIHRoaXNbb2Zmc2V0ICsgaV0gPSAoKHZhbHVlIC8gbXVsKSA+PiAwKSAtIHN1YiAmIDB4RkZcbiAgfVxuXG4gIHJldHVybiBvZmZzZXQgKyBieXRlTGVuZ3RoXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnRCRSA9IGZ1bmN0aW9uIHdyaXRlSW50QkUgKHZhbHVlLCBvZmZzZXQsIGJ5dGVMZW5ndGgsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgdmFyIGxpbWl0ID0gTWF0aC5wb3coMiwgKDggKiBieXRlTGVuZ3RoKSAtIDEpXG5cbiAgICBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCBieXRlTGVuZ3RoLCBsaW1pdCAtIDEsIC1saW1pdClcbiAgfVxuXG4gIHZhciBpID0gYnl0ZUxlbmd0aCAtIDFcbiAgdmFyIG11bCA9IDFcbiAgdmFyIHN1YiA9IDBcbiAgdGhpc1tvZmZzZXQgKyBpXSA9IHZhbHVlICYgMHhGRlxuICB3aGlsZSAoLS1pID49IDAgJiYgKG11bCAqPSAweDEwMCkpIHtcbiAgICBpZiAodmFsdWUgPCAwICYmIHN1YiA9PT0gMCAmJiB0aGlzW29mZnNldCArIGkgKyAxXSAhPT0gMCkge1xuICAgICAgc3ViID0gMVxuICAgIH1cbiAgICB0aGlzW29mZnNldCArIGldID0gKCh2YWx1ZSAvIG11bCkgPj4gMCkgLSBzdWIgJiAweEZGXG4gIH1cblxuICByZXR1cm4gb2Zmc2V0ICsgYnl0ZUxlbmd0aFxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50OCA9IGZ1bmN0aW9uIHdyaXRlSW50OCAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDEsIDB4N2YsIC0weDgwKVxuICBpZiAodmFsdWUgPCAwKSB2YWx1ZSA9IDB4ZmYgKyB2YWx1ZSArIDFcbiAgdGhpc1tvZmZzZXRdID0gKHZhbHVlICYgMHhmZilcbiAgcmV0dXJuIG9mZnNldCArIDFcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUludDE2TEUgPSBmdW5jdGlvbiB3cml0ZUludDE2TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSBjaGVja0ludCh0aGlzLCB2YWx1ZSwgb2Zmc2V0LCAyLCAweDdmZmYsIC0weDgwMDApXG4gIHRoaXNbb2Zmc2V0XSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgPj4+IDgpXG4gIHJldHVybiBvZmZzZXQgKyAyXG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQxNkJFID0gZnVuY3Rpb24gd3JpdGVJbnQxNkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgMiwgMHg3ZmZmLCAtMHg4MDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDgpXG4gIHRoaXNbb2Zmc2V0ICsgMV0gPSAodmFsdWUgJiAweGZmKVxuICByZXR1cm4gb2Zmc2V0ICsgMlxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlSW50MzJMRSA9IGZ1bmN0aW9uIHdyaXRlSW50MzJMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIGNoZWNrSW50KHRoaXMsIHZhbHVlLCBvZmZzZXQsIDQsIDB4N2ZmZmZmZmYsIC0weDgwMDAwMDAwKVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgJiAweGZmKVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiA4KVxuICB0aGlzW29mZnNldCArIDJdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSA+Pj4gMjQpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbkJ1ZmZlci5wcm90b3R5cGUud3JpdGVJbnQzMkJFID0gZnVuY3Rpb24gd3JpdGVJbnQzMkJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICB2YWx1ZSA9ICt2YWx1ZVxuICBvZmZzZXQgPSBvZmZzZXQgPj4+IDBcbiAgaWYgKCFub0Fzc2VydCkgY2hlY2tJbnQodGhpcywgdmFsdWUsIG9mZnNldCwgNCwgMHg3ZmZmZmZmZiwgLTB4ODAwMDAwMDApXG4gIGlmICh2YWx1ZSA8IDApIHZhbHVlID0gMHhmZmZmZmZmZiArIHZhbHVlICsgMVxuICB0aGlzW29mZnNldF0gPSAodmFsdWUgPj4+IDI0KVxuICB0aGlzW29mZnNldCArIDFdID0gKHZhbHVlID4+PiAxNilcbiAgdGhpc1tvZmZzZXQgKyAyXSA9ICh2YWx1ZSA+Pj4gOClcbiAgdGhpc1tvZmZzZXQgKyAzXSA9ICh2YWx1ZSAmIDB4ZmYpXG4gIHJldHVybiBvZmZzZXQgKyA0XG59XG5cbmZ1bmN0aW9uIGNoZWNrSUVFRTc1NCAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBleHQsIG1heCwgbWluKSB7XG4gIGlmIChvZmZzZXQgKyBleHQgPiBidWYubGVuZ3RoKSB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW5kZXggb3V0IG9mIHJhbmdlJylcbiAgaWYgKG9mZnNldCA8IDApIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxufVxuXG5mdW5jdGlvbiB3cml0ZUZsb2F0IChidWYsIHZhbHVlLCBvZmZzZXQsIGxpdHRsZUVuZGlhbiwgbm9Bc3NlcnQpIHtcbiAgdmFsdWUgPSArdmFsdWVcbiAgb2Zmc2V0ID0gb2Zmc2V0ID4+PiAwXG4gIGlmICghbm9Bc3NlcnQpIHtcbiAgICBjaGVja0lFRUU3NTQoYnVmLCB2YWx1ZSwgb2Zmc2V0LCA0LCAzLjQwMjgyMzQ2NjM4NTI4ODZlKzM4LCAtMy40MDI4MjM0NjYzODUyODg2ZSszOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCAyMywgNClcbiAgcmV0dXJuIG9mZnNldCArIDRcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZUZsb2F0TEUgPSBmdW5jdGlvbiB3cml0ZUZsb2F0TEUgKHZhbHVlLCBvZmZzZXQsIG5vQXNzZXJ0KSB7XG4gIHJldHVybiB3cml0ZUZsb2F0KHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRmxvYXRCRSA9IGZ1bmN0aW9uIHdyaXRlRmxvYXRCRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRmxvYXQodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG5mdW5jdGlvbiB3cml0ZURvdWJsZSAoYnVmLCB2YWx1ZSwgb2Zmc2V0LCBsaXR0bGVFbmRpYW4sIG5vQXNzZXJ0KSB7XG4gIHZhbHVlID0gK3ZhbHVlXG4gIG9mZnNldCA9IG9mZnNldCA+Pj4gMFxuICBpZiAoIW5vQXNzZXJ0KSB7XG4gICAgY2hlY2tJRUVFNzU0KGJ1ZiwgdmFsdWUsIG9mZnNldCwgOCwgMS43OTc2OTMxMzQ4NjIzMTU3RSszMDgsIC0xLjc5NzY5MzEzNDg2MjMxNTdFKzMwOClcbiAgfVxuICBpZWVlNzU0LndyaXRlKGJ1ZiwgdmFsdWUsIG9mZnNldCwgbGl0dGxlRW5kaWFuLCA1MiwgOClcbiAgcmV0dXJuIG9mZnNldCArIDhcbn1cblxuQnVmZmVyLnByb3RvdHlwZS53cml0ZURvdWJsZUxFID0gZnVuY3Rpb24gd3JpdGVEb3VibGVMRSAodmFsdWUsIG9mZnNldCwgbm9Bc3NlcnQpIHtcbiAgcmV0dXJuIHdyaXRlRG91YmxlKHRoaXMsIHZhbHVlLCBvZmZzZXQsIHRydWUsIG5vQXNzZXJ0KVxufVxuXG5CdWZmZXIucHJvdG90eXBlLndyaXRlRG91YmxlQkUgPSBmdW5jdGlvbiB3cml0ZURvdWJsZUJFICh2YWx1ZSwgb2Zmc2V0LCBub0Fzc2VydCkge1xuICByZXR1cm4gd3JpdGVEb3VibGUodGhpcywgdmFsdWUsIG9mZnNldCwgZmFsc2UsIG5vQXNzZXJ0KVxufVxuXG4vLyBjb3B5KHRhcmdldEJ1ZmZlciwgdGFyZ2V0U3RhcnQ9MCwgc291cmNlU3RhcnQ9MCwgc291cmNlRW5kPWJ1ZmZlci5sZW5ndGgpXG5CdWZmZXIucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiBjb3B5ICh0YXJnZXQsIHRhcmdldFN0YXJ0LCBzdGFydCwgZW5kKSB7XG4gIGlmICghQnVmZmVyLmlzQnVmZmVyKHRhcmdldCkpIHRocm93IG5ldyBUeXBlRXJyb3IoJ2FyZ3VtZW50IHNob3VsZCBiZSBhIEJ1ZmZlcicpXG4gIGlmICghc3RhcnQpIHN0YXJ0ID0gMFxuICBpZiAoIWVuZCAmJiBlbmQgIT09IDApIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXRTdGFydCA+PSB0YXJnZXQubGVuZ3RoKSB0YXJnZXRTdGFydCA9IHRhcmdldC5sZW5ndGhcbiAgaWYgKCF0YXJnZXRTdGFydCkgdGFyZ2V0U3RhcnQgPSAwXG4gIGlmIChlbmQgPiAwICYmIGVuZCA8IHN0YXJ0KSBlbmQgPSBzdGFydFxuXG4gIC8vIENvcHkgMCBieXRlczsgd2UncmUgZG9uZVxuICBpZiAoZW5kID09PSBzdGFydCkgcmV0dXJuIDBcbiAgaWYgKHRhcmdldC5sZW5ndGggPT09IDAgfHwgdGhpcy5sZW5ndGggPT09IDApIHJldHVybiAwXG5cbiAgLy8gRmF0YWwgZXJyb3IgY29uZGl0aW9uc1xuICBpZiAodGFyZ2V0U3RhcnQgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3RhcmdldFN0YXJ0IG91dCBvZiBib3VuZHMnKVxuICB9XG4gIGlmIChzdGFydCA8IDAgfHwgc3RhcnQgPj0gdGhpcy5sZW5ndGgpIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbmRleCBvdXQgb2YgcmFuZ2UnKVxuICBpZiAoZW5kIDwgMCkgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ3NvdXJjZUVuZCBvdXQgb2YgYm91bmRzJylcblxuICAvLyBBcmUgd2Ugb29iP1xuICBpZiAoZW5kID4gdGhpcy5sZW5ndGgpIGVuZCA9IHRoaXMubGVuZ3RoXG4gIGlmICh0YXJnZXQubGVuZ3RoIC0gdGFyZ2V0U3RhcnQgPCBlbmQgLSBzdGFydCkge1xuICAgIGVuZCA9IHRhcmdldC5sZW5ndGggLSB0YXJnZXRTdGFydCArIHN0YXJ0XG4gIH1cblxuICB2YXIgbGVuID0gZW5kIC0gc3RhcnRcblxuICBpZiAodGhpcyA9PT0gdGFyZ2V0ICYmIHR5cGVvZiBVaW50OEFycmF5LnByb3RvdHlwZS5jb3B5V2l0aGluID09PSAnZnVuY3Rpb24nKSB7XG4gICAgLy8gVXNlIGJ1aWx0LWluIHdoZW4gYXZhaWxhYmxlLCBtaXNzaW5nIGZyb20gSUUxMVxuICAgIHRoaXMuY29weVdpdGhpbih0YXJnZXRTdGFydCwgc3RhcnQsIGVuZClcbiAgfSBlbHNlIGlmICh0aGlzID09PSB0YXJnZXQgJiYgc3RhcnQgPCB0YXJnZXRTdGFydCAmJiB0YXJnZXRTdGFydCA8IGVuZCkge1xuICAgIC8vIGRlc2NlbmRpbmcgY29weSBmcm9tIGVuZFxuICAgIGZvciAodmFyIGkgPSBsZW4gLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgdGFyZ2V0W2kgKyB0YXJnZXRTdGFydF0gPSB0aGlzW2kgKyBzdGFydF1cbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgVWludDhBcnJheS5wcm90b3R5cGUuc2V0LmNhbGwoXG4gICAgICB0YXJnZXQsXG4gICAgICB0aGlzLnN1YmFycmF5KHN0YXJ0LCBlbmQpLFxuICAgICAgdGFyZ2V0U3RhcnRcbiAgICApXG4gIH1cblxuICByZXR1cm4gbGVuXG59XG5cbi8vIFVzYWdlOlxuLy8gICAgYnVmZmVyLmZpbGwobnVtYmVyWywgb2Zmc2V0WywgZW5kXV0pXG4vLyAgICBidWZmZXIuZmlsbChidWZmZXJbLCBvZmZzZXRbLCBlbmRdXSlcbi8vICAgIGJ1ZmZlci5maWxsKHN0cmluZ1ssIG9mZnNldFssIGVuZF1dWywgZW5jb2RpbmddKVxuQnVmZmVyLnByb3RvdHlwZS5maWxsID0gZnVuY3Rpb24gZmlsbCAodmFsLCBzdGFydCwgZW5kLCBlbmNvZGluZykge1xuICAvLyBIYW5kbGUgc3RyaW5nIGNhc2VzOlxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAodHlwZW9mIHN0YXJ0ID09PSAnc3RyaW5nJykge1xuICAgICAgZW5jb2RpbmcgPSBzdGFydFxuICAgICAgc3RhcnQgPSAwXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGVuZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGVuY29kaW5nID0gZW5kXG4gICAgICBlbmQgPSB0aGlzLmxlbmd0aFxuICAgIH1cbiAgICBpZiAoZW5jb2RpbmcgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZW5jb2RpbmcgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdlbmNvZGluZyBtdXN0IGJlIGEgc3RyaW5nJylcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlbmNvZGluZyA9PT0gJ3N0cmluZycgJiYgIUJ1ZmZlci5pc0VuY29kaW5nKGVuY29kaW5nKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVW5rbm93biBlbmNvZGluZzogJyArIGVuY29kaW5nKVxuICAgIH1cbiAgICBpZiAodmFsLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIGNvZGUgPSB2YWwuY2hhckNvZGVBdCgwKVxuICAgICAgaWYgKChlbmNvZGluZyA9PT0gJ3V0ZjgnICYmIGNvZGUgPCAxMjgpIHx8XG4gICAgICAgICAgZW5jb2RpbmcgPT09ICdsYXRpbjEnKSB7XG4gICAgICAgIC8vIEZhc3QgcGF0aDogSWYgYHZhbGAgZml0cyBpbnRvIGEgc2luZ2xlIGJ5dGUsIHVzZSB0aGF0IG51bWVyaWMgdmFsdWUuXG4gICAgICAgIHZhbCA9IGNvZGVcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICB2YWwgPSB2YWwgJiAyNTVcbiAgfVxuXG4gIC8vIEludmFsaWQgcmFuZ2VzIGFyZSBub3Qgc2V0IHRvIGEgZGVmYXVsdCwgc28gY2FuIHJhbmdlIGNoZWNrIGVhcmx5LlxuICBpZiAoc3RhcnQgPCAwIHx8IHRoaXMubGVuZ3RoIDwgc3RhcnQgfHwgdGhpcy5sZW5ndGggPCBlbmQpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignT3V0IG9mIHJhbmdlIGluZGV4JylcbiAgfVxuXG4gIGlmIChlbmQgPD0gc3RhcnQpIHtcbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgc3RhcnQgPSBzdGFydCA+Pj4gMFxuICBlbmQgPSBlbmQgPT09IHVuZGVmaW5lZCA/IHRoaXMubGVuZ3RoIDogZW5kID4+PiAwXG5cbiAgaWYgKCF2YWwpIHZhbCA9IDBcblxuICB2YXIgaVxuICBpZiAodHlwZW9mIHZhbCA9PT0gJ251bWJlcicpIHtcbiAgICBmb3IgKGkgPSBzdGFydDsgaSA8IGVuZDsgKytpKSB7XG4gICAgICB0aGlzW2ldID0gdmFsXG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciBieXRlcyA9IEJ1ZmZlci5pc0J1ZmZlcih2YWwpXG4gICAgICA/IHZhbFxuICAgICAgOiBCdWZmZXIuZnJvbSh2YWwsIGVuY29kaW5nKVxuICAgIHZhciBsZW4gPSBieXRlcy5sZW5ndGhcbiAgICBpZiAobGVuID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgdmFsdWUgXCInICsgdmFsICtcbiAgICAgICAgJ1wiIGlzIGludmFsaWQgZm9yIGFyZ3VtZW50IFwidmFsdWVcIicpXG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBlbmQgLSBzdGFydDsgKytpKSB7XG4gICAgICB0aGlzW2kgKyBzdGFydF0gPSBieXRlc1tpICUgbGVuXVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzXG59XG5cbi8vIEhFTFBFUiBGVU5DVElPTlNcbi8vID09PT09PT09PT09PT09PT1cblxudmFyIElOVkFMSURfQkFTRTY0X1JFID0gL1teKy8wLTlBLVphLXotX10vZ1xuXG5mdW5jdGlvbiBiYXNlNjRjbGVhbiAoc3RyKSB7XG4gIC8vIE5vZGUgdGFrZXMgZXF1YWwgc2lnbnMgYXMgZW5kIG9mIHRoZSBCYXNlNjQgZW5jb2RpbmdcbiAgc3RyID0gc3RyLnNwbGl0KCc9JylbMF1cbiAgLy8gTm9kZSBzdHJpcHMgb3V0IGludmFsaWQgY2hhcmFjdGVycyBsaWtlIFxcbiBhbmQgXFx0IGZyb20gdGhlIHN0cmluZywgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHN0ciA9IHN0ci50cmltKCkucmVwbGFjZShJTlZBTElEX0JBU0U2NF9SRSwgJycpXG4gIC8vIE5vZGUgY29udmVydHMgc3RyaW5ncyB3aXRoIGxlbmd0aCA8IDIgdG8gJydcbiAgaWYgKHN0ci5sZW5ndGggPCAyKSByZXR1cm4gJydcbiAgLy8gTm9kZSBhbGxvd3MgZm9yIG5vbi1wYWRkZWQgYmFzZTY0IHN0cmluZ3MgKG1pc3NpbmcgdHJhaWxpbmcgPT09KSwgYmFzZTY0LWpzIGRvZXMgbm90XG4gIHdoaWxlIChzdHIubGVuZ3RoICUgNCAhPT0gMCkge1xuICAgIHN0ciA9IHN0ciArICc9J1xuICB9XG4gIHJldHVybiBzdHJcbn1cblxuZnVuY3Rpb24gdG9IZXggKG4pIHtcbiAgaWYgKG4gPCAxNikgcmV0dXJuICcwJyArIG4udG9TdHJpbmcoMTYpXG4gIHJldHVybiBuLnRvU3RyaW5nKDE2KVxufVxuXG5mdW5jdGlvbiB1dGY4VG9CeXRlcyAoc3RyaW5nLCB1bml0cykge1xuICB1bml0cyA9IHVuaXRzIHx8IEluZmluaXR5XG4gIHZhciBjb2RlUG9pbnRcbiAgdmFyIGxlbmd0aCA9IHN0cmluZy5sZW5ndGhcbiAgdmFyIGxlYWRTdXJyb2dhdGUgPSBudWxsXG4gIHZhciBieXRlcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGNvZGVQb2ludCA9IHN0cmluZy5jaGFyQ29kZUF0KGkpXG5cbiAgICAvLyBpcyBzdXJyb2dhdGUgY29tcG9uZW50XG4gICAgaWYgKGNvZGVQb2ludCA+IDB4RDdGRiAmJiBjb2RlUG9pbnQgPCAweEUwMDApIHtcbiAgICAgIC8vIGxhc3QgY2hhciB3YXMgYSBsZWFkXG4gICAgICBpZiAoIWxlYWRTdXJyb2dhdGUpIHtcbiAgICAgICAgLy8gbm8gbGVhZCB5ZXRcbiAgICAgICAgaWYgKGNvZGVQb2ludCA+IDB4REJGRikge1xuICAgICAgICAgIC8vIHVuZXhwZWN0ZWQgdHJhaWxcbiAgICAgICAgICBpZiAoKHVuaXRzIC09IDMpID4gLTEpIGJ5dGVzLnB1c2goMHhFRiwgMHhCRiwgMHhCRClcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2UgaWYgKGkgKyAxID09PSBsZW5ndGgpIHtcbiAgICAgICAgICAvLyB1bnBhaXJlZCBsZWFkXG4gICAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhbGlkIGxlYWRcbiAgICAgICAgbGVhZFN1cnJvZ2F0ZSA9IGNvZGVQb2ludFxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIC8vIDIgbGVhZHMgaW4gYSByb3dcbiAgICAgIGlmIChjb2RlUG9pbnQgPCAweERDMDApIHtcbiAgICAgICAgaWYgKCh1bml0cyAtPSAzKSA+IC0xKSBieXRlcy5wdXNoKDB4RUYsIDB4QkYsIDB4QkQpXG4gICAgICAgIGxlYWRTdXJyb2dhdGUgPSBjb2RlUG9pbnRcbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgLy8gdmFsaWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgIGNvZGVQb2ludCA9IChsZWFkU3Vycm9nYXRlIC0gMHhEODAwIDw8IDEwIHwgY29kZVBvaW50IC0gMHhEQzAwKSArIDB4MTAwMDBcbiAgICB9IGVsc2UgaWYgKGxlYWRTdXJyb2dhdGUpIHtcbiAgICAgIC8vIHZhbGlkIGJtcCBjaGFyLCBidXQgbGFzdCBjaGFyIHdhcyBhIGxlYWRcbiAgICAgIGlmICgodW5pdHMgLT0gMykgPiAtMSkgYnl0ZXMucHVzaCgweEVGLCAweEJGLCAweEJEKVxuICAgIH1cblxuICAgIGxlYWRTdXJyb2dhdGUgPSBudWxsXG5cbiAgICAvLyBlbmNvZGUgdXRmOFxuICAgIGlmIChjb2RlUG9pbnQgPCAweDgwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDEpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goY29kZVBvaW50KVxuICAgIH0gZWxzZSBpZiAoY29kZVBvaW50IDwgMHg4MDApIHtcbiAgICAgIGlmICgodW5pdHMgLT0gMikgPCAwKSBicmVha1xuICAgICAgYnl0ZXMucHVzaChcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiB8IDB4QzAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDEwMDAwKSB7XG4gICAgICBpZiAoKHVuaXRzIC09IDMpIDwgMCkgYnJlYWtcbiAgICAgIGJ5dGVzLnB1c2goXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgfCAweEUwLFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHg2ICYgMHgzRiB8IDB4ODAsXG4gICAgICAgIGNvZGVQb2ludCAmIDB4M0YgfCAweDgwXG4gICAgICApXG4gICAgfSBlbHNlIGlmIChjb2RlUG9pbnQgPCAweDExMDAwMCkge1xuICAgICAgaWYgKCh1bml0cyAtPSA0KSA8IDApIGJyZWFrXG4gICAgICBieXRlcy5wdXNoKFxuICAgICAgICBjb2RlUG9pbnQgPj4gMHgxMiB8IDB4RjAsXG4gICAgICAgIGNvZGVQb2ludCA+PiAweEMgJiAweDNGIHwgMHg4MCxcbiAgICAgICAgY29kZVBvaW50ID4+IDB4NiAmIDB4M0YgfCAweDgwLFxuICAgICAgICBjb2RlUG9pbnQgJiAweDNGIHwgMHg4MFxuICAgICAgKVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY29kZSBwb2ludCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVzXG59XG5cbmZ1bmN0aW9uIGFzY2lpVG9CeXRlcyAoc3RyKSB7XG4gIHZhciBieXRlQXJyYXkgPSBbXVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHN0ci5sZW5ndGg7ICsraSkge1xuICAgIC8vIE5vZGUncyBjb2RlIHNlZW1zIHRvIGJlIGRvaW5nIHRoaXMgYW5kIG5vdCAmIDB4N0YuLlxuICAgIGJ5dGVBcnJheS5wdXNoKHN0ci5jaGFyQ29kZUF0KGkpICYgMHhGRilcbiAgfVxuICByZXR1cm4gYnl0ZUFycmF5XG59XG5cbmZ1bmN0aW9uIHV0ZjE2bGVUb0J5dGVzIChzdHIsIHVuaXRzKSB7XG4gIHZhciBjLCBoaSwgbG9cbiAgdmFyIGJ5dGVBcnJheSA9IFtdXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKCh1bml0cyAtPSAyKSA8IDApIGJyZWFrXG5cbiAgICBjID0gc3RyLmNoYXJDb2RlQXQoaSlcbiAgICBoaSA9IGMgPj4gOFxuICAgIGxvID0gYyAlIDI1NlxuICAgIGJ5dGVBcnJheS5wdXNoKGxvKVxuICAgIGJ5dGVBcnJheS5wdXNoKGhpKVxuICB9XG5cbiAgcmV0dXJuIGJ5dGVBcnJheVxufVxuXG5mdW5jdGlvbiBiYXNlNjRUb0J5dGVzIChzdHIpIHtcbiAgcmV0dXJuIGJhc2U2NC50b0J5dGVBcnJheShiYXNlNjRjbGVhbihzdHIpKVxufVxuXG5mdW5jdGlvbiBibGl0QnVmZmVyIChzcmMsIGRzdCwgb2Zmc2V0LCBsZW5ndGgpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgIGlmICgoaSArIG9mZnNldCA+PSBkc3QubGVuZ3RoKSB8fCAoaSA+PSBzcmMubGVuZ3RoKSkgYnJlYWtcbiAgICBkc3RbaSArIG9mZnNldF0gPSBzcmNbaV1cbiAgfVxuICByZXR1cm4gaVxufVxuXG4vLyBBcnJheUJ1ZmZlciBvciBVaW50OEFycmF5IG9iamVjdHMgZnJvbSBvdGhlciBjb250ZXh0cyAoaS5lLiBpZnJhbWVzKSBkbyBub3QgcGFzc1xuLy8gdGhlIGBpbnN0YW5jZW9mYCBjaGVjayBidXQgdGhleSBzaG91bGQgYmUgdHJlYXRlZCBhcyBvZiB0aGF0IHR5cGUuXG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2lzc3Vlcy8xNjZcbmZ1bmN0aW9uIGlzSW5zdGFuY2UgKG9iaiwgdHlwZSkge1xuICByZXR1cm4gb2JqIGluc3RhbmNlb2YgdHlwZSB8fFxuICAgIChvYmogIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IgIT0gbnVsbCAmJiBvYmouY29uc3RydWN0b3IubmFtZSAhPSBudWxsICYmXG4gICAgICBvYmouY29uc3RydWN0b3IubmFtZSA9PT0gdHlwZS5uYW1lKVxufVxuZnVuY3Rpb24gbnVtYmVySXNOYU4gKG9iaikge1xuICAvLyBGb3IgSUUxMSBzdXBwb3J0XG4gIHJldHVybiBvYmogIT09IG9iaiAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXNlbGYtY29tcGFyZVxufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xuXG52YXIgY2FsbEJpbmQgPSByZXF1aXJlKCcuLycpO1xuXG52YXIgJGluZGV4T2YgPSBjYWxsQmluZChHZXRJbnRyaW5zaWMoJ1N0cmluZy5wcm90b3R5cGUuaW5kZXhPZicpKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQm91bmRJbnRyaW5zaWMobmFtZSwgYWxsb3dNaXNzaW5nKSB7XG5cdHZhciBpbnRyaW5zaWMgPSBHZXRJbnRyaW5zaWMobmFtZSwgISFhbGxvd01pc3NpbmcpO1xuXHRpZiAodHlwZW9mIGludHJpbnNpYyA9PT0gJ2Z1bmN0aW9uJyAmJiAkaW5kZXhPZihuYW1lLCAnLnByb3RvdHlwZS4nKSA+IC0xKSB7XG5cdFx0cmV0dXJuIGNhbGxCaW5kKGludHJpbnNpYyk7XG5cdH1cblx0cmV0dXJuIGludHJpbnNpYztcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBiaW5kID0gcmVxdWlyZSgnZnVuY3Rpb24tYmluZCcpO1xudmFyIEdldEludHJpbnNpYyA9IHJlcXVpcmUoJ2dldC1pbnRyaW5zaWMnKTtcblxudmFyICRhcHBseSA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSUnKTtcbnZhciAkY2FsbCA9IEdldEludHJpbnNpYygnJUZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsJScpO1xudmFyICRyZWZsZWN0QXBwbHkgPSBHZXRJbnRyaW5zaWMoJyVSZWZsZWN0LmFwcGx5JScsIHRydWUpIHx8IGJpbmQuY2FsbCgkY2FsbCwgJGFwcGx5KTtcblxudmFyICRnT1BEID0gR2V0SW50cmluc2ljKCclT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciUnLCB0cnVlKTtcbnZhciAkZGVmaW5lUHJvcGVydHkgPSBHZXRJbnRyaW5zaWMoJyVPYmplY3QuZGVmaW5lUHJvcGVydHklJywgdHJ1ZSk7XG52YXIgJG1heCA9IEdldEludHJpbnNpYygnJU1hdGgubWF4JScpO1xuXG5pZiAoJGRlZmluZVByb3BlcnR5KSB7XG5cdHRyeSB7XG5cdFx0JGRlZmluZVByb3BlcnR5KHt9LCAnYScsIHsgdmFsdWU6IDEgfSk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQvLyBJRSA4IGhhcyBhIGJyb2tlbiBkZWZpbmVQcm9wZXJ0eVxuXHRcdCRkZWZpbmVQcm9wZXJ0eSA9IG51bGw7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBjYWxsQmluZChvcmlnaW5hbEZ1bmN0aW9uKSB7XG5cdHZhciBmdW5jID0gJHJlZmxlY3RBcHBseShiaW5kLCAkY2FsbCwgYXJndW1lbnRzKTtcblx0aWYgKCRnT1BEICYmICRkZWZpbmVQcm9wZXJ0eSkge1xuXHRcdHZhciBkZXNjID0gJGdPUEQoZnVuYywgJ2xlbmd0aCcpO1xuXHRcdGlmIChkZXNjLmNvbmZpZ3VyYWJsZSkge1xuXHRcdFx0Ly8gb3JpZ2luYWwgbGVuZ3RoLCBwbHVzIHRoZSByZWNlaXZlciwgbWludXMgYW55IGFkZGl0aW9uYWwgYXJndW1lbnRzIChhZnRlciB0aGUgcmVjZWl2ZXIpXG5cdFx0XHQkZGVmaW5lUHJvcGVydHkoXG5cdFx0XHRcdGZ1bmMsXG5cdFx0XHRcdCdsZW5ndGgnLFxuXHRcdFx0XHR7IHZhbHVlOiAxICsgJG1heCgwLCBvcmlnaW5hbEZ1bmN0aW9uLmxlbmd0aCAtIChhcmd1bWVudHMubGVuZ3RoIC0gMSkpIH1cblx0XHRcdCk7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmdW5jO1xufTtcblxudmFyIGFwcGx5QmluZCA9IGZ1bmN0aW9uIGFwcGx5QmluZCgpIHtcblx0cmV0dXJuICRyZWZsZWN0QXBwbHkoYmluZCwgJGFwcGx5LCBhcmd1bWVudHMpO1xufTtcblxuaWYgKCRkZWZpbmVQcm9wZXJ0eSkge1xuXHQkZGVmaW5lUHJvcGVydHkobW9kdWxlLmV4cG9ydHMsICdhcHBseScsIHsgdmFsdWU6IGFwcGx5QmluZCB9KTtcbn0gZWxzZSB7XG5cdG1vZHVsZS5leHBvcnRzLmFwcGx5ID0gYXBwbHlCaW5kO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNDYWxsYWJsZSA9IHJlcXVpcmUoJ2lzLWNhbGxhYmxlJyk7XG5cbnZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG52YXIgZm9yRWFjaEFycmF5ID0gZnVuY3Rpb24gZm9yRWFjaEFycmF5KGFycmF5LCBpdGVyYXRvciwgcmVjZWl2ZXIpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgaWYgKGhhc093blByb3BlcnR5LmNhbGwoYXJyYXksIGkpKSB7XG4gICAgICAgICAgICBpZiAocmVjZWl2ZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKGFycmF5W2ldLCBpLCBhcnJheSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwocmVjZWl2ZXIsIGFycmF5W2ldLCBpLCBhcnJheSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgZm9yRWFjaFN0cmluZyA9IGZ1bmN0aW9uIGZvckVhY2hTdHJpbmcoc3RyaW5nLCBpdGVyYXRvciwgcmVjZWl2ZXIpIHtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gc3RyaW5nLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIC8vIG5vIHN1Y2ggdGhpbmcgYXMgYSBzcGFyc2Ugc3RyaW5nLlxuICAgICAgICBpZiAocmVjZWl2ZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgaXRlcmF0b3Ioc3RyaW5nLmNoYXJBdChpKSwgaSwgc3RyaW5nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZXJhdG9yLmNhbGwocmVjZWl2ZXIsIHN0cmluZy5jaGFyQXQoaSksIGksIHN0cmluZyk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG52YXIgZm9yRWFjaE9iamVjdCA9IGZ1bmN0aW9uIGZvckVhY2hPYmplY3Qob2JqZWN0LCBpdGVyYXRvciwgcmVjZWl2ZXIpIHtcbiAgICBmb3IgKHZhciBrIGluIG9iamVjdCkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIGspKSB7XG4gICAgICAgICAgICBpZiAocmVjZWl2ZXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGl0ZXJhdG9yKG9iamVjdFtrXSwgaywgb2JqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaXRlcmF0b3IuY2FsbChyZWNlaXZlciwgb2JqZWN0W2tdLCBrLCBvYmplY3QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufTtcblxudmFyIGZvckVhY2ggPSBmdW5jdGlvbiBmb3JFYWNoKGxpc3QsIGl0ZXJhdG9yLCB0aGlzQXJnKSB7XG4gICAgaWYgKCFpc0NhbGxhYmxlKGl0ZXJhdG9yKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpdGVyYXRvciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgICB9XG5cbiAgICB2YXIgcmVjZWl2ZXI7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykge1xuICAgICAgICByZWNlaXZlciA9IHRoaXNBcmc7XG4gICAgfVxuXG4gICAgaWYgKHRvU3RyLmNhbGwobGlzdCkgPT09ICdbb2JqZWN0IEFycmF5XScpIHtcbiAgICAgICAgZm9yRWFjaEFycmF5KGxpc3QsIGl0ZXJhdG9yLCByZWNlaXZlcik7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbGlzdCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZm9yRWFjaFN0cmluZyhsaXN0LCBpdGVyYXRvciwgcmVjZWl2ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGZvckVhY2hPYmplY3QobGlzdCwgaXRlcmF0b3IsIHJlY2VpdmVyKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZvckVhY2g7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qIGVzbGludCBuby1pbnZhbGlkLXRoaXM6IDEgKi9cblxudmFyIEVSUk9SX01FU1NBR0UgPSAnRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgY2FsbGVkIG9uIGluY29tcGF0aWJsZSAnO1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBmdW5jVHlwZSA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gYmluZCh0aGF0KSB7XG4gICAgdmFyIHRhcmdldCA9IHRoaXM7XG4gICAgaWYgKHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicgfHwgdG9TdHIuY2FsbCh0YXJnZXQpICE9PSBmdW5jVHlwZSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKEVSUk9SX01FU1NBR0UgKyB0YXJnZXQpO1xuICAgIH1cbiAgICB2YXIgYXJncyA9IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICAgIHZhciBib3VuZDtcbiAgICB2YXIgYmluZGVyID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mIGJvdW5kKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gdGFyZ2V0LmFwcGx5KFxuICAgICAgICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgICAgICAgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGlmIChPYmplY3QocmVzdWx0KSA9PT0gcmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBseShcbiAgICAgICAgICAgICAgICB0aGF0LFxuICAgICAgICAgICAgICAgIGFyZ3MuY29uY2F0KHNsaWNlLmNhbGwoYXJndW1lbnRzKSlcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIGJvdW5kTGVuZ3RoID0gTWF0aC5tYXgoMCwgdGFyZ2V0Lmxlbmd0aCAtIGFyZ3MubGVuZ3RoKTtcbiAgICB2YXIgYm91bmRBcmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBib3VuZExlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJvdW5kQXJncy5wdXNoKCckJyArIGkpO1xuICAgIH1cblxuICAgIGJvdW5kID0gRnVuY3Rpb24oJ2JpbmRlcicsICdyZXR1cm4gZnVuY3Rpb24gKCcgKyBib3VuZEFyZ3Muam9pbignLCcpICsgJyl7IHJldHVybiBiaW5kZXIuYXBwbHkodGhpcyxhcmd1bWVudHMpOyB9JykoYmluZGVyKTtcblxuICAgIGlmICh0YXJnZXQucHJvdG90eXBlKSB7XG4gICAgICAgIHZhciBFbXB0eSA9IGZ1bmN0aW9uIEVtcHR5KCkge307XG4gICAgICAgIEVtcHR5LnByb3RvdHlwZSA9IHRhcmdldC5wcm90b3R5cGU7XG4gICAgICAgIGJvdW5kLnByb3RvdHlwZSA9IG5ldyBFbXB0eSgpO1xuICAgICAgICBFbXB0eS5wcm90b3R5cGUgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiBib3VuZDtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBpbXBsZW1lbnRhdGlvbiA9IHJlcXVpcmUoJy4vaW1wbGVtZW50YXRpb24nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCB8fCBpbXBsZW1lbnRhdGlvbjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHVuZGVmaW5lZDtcblxudmFyICRTeW50YXhFcnJvciA9IFN5bnRheEVycm9yO1xudmFyICRGdW5jdGlvbiA9IEZ1bmN0aW9uO1xudmFyICRUeXBlRXJyb3IgPSBUeXBlRXJyb3I7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb25zaXN0ZW50LXJldHVyblxudmFyIGdldEV2YWxsZWRDb25zdHJ1Y3RvciA9IGZ1bmN0aW9uIChleHByZXNzaW9uU3ludGF4KSB7XG5cdHRyeSB7XG5cdFx0cmV0dXJuICRGdW5jdGlvbignXCJ1c2Ugc3RyaWN0XCI7IHJldHVybiAoJyArIGV4cHJlc3Npb25TeW50YXggKyAnKS5jb25zdHJ1Y3RvcjsnKSgpO1xuXHR9IGNhdGNoIChlKSB7fVxufTtcblxudmFyICRnT1BEID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcjtcbmlmICgkZ09QRCkge1xuXHR0cnkge1xuXHRcdCRnT1BEKHt9LCAnJyk7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHQkZ09QRCA9IG51bGw7IC8vIHRoaXMgaXMgSUUgOCwgd2hpY2ggaGFzIGEgYnJva2VuIGdPUERcblx0fVxufVxuXG52YXIgdGhyb3dUeXBlRXJyb3IgPSBmdW5jdGlvbiAoKSB7XG5cdHRocm93IG5ldyAkVHlwZUVycm9yKCk7XG59O1xudmFyIFRocm93VHlwZUVycm9yID0gJGdPUERcblx0PyAoZnVuY3Rpb24gKCkge1xuXHRcdHRyeSB7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLWV4cHJlc3Npb25zLCBuby1jYWxsZXIsIG5vLXJlc3RyaWN0ZWQtcHJvcGVydGllc1xuXHRcdFx0YXJndW1lbnRzLmNhbGxlZTsgLy8gSUUgOCBkb2VzIG5vdCB0aHJvdyBoZXJlXG5cdFx0XHRyZXR1cm4gdGhyb3dUeXBlRXJyb3I7XG5cdFx0fSBjYXRjaCAoY2FsbGVlVGhyb3dzKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHQvLyBJRSA4IHRocm93cyBvbiBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKGFyZ3VtZW50cywgJycpXG5cdFx0XHRcdHJldHVybiAkZ09QRChhcmd1bWVudHMsICdjYWxsZWUnKS5nZXQ7XG5cdFx0XHR9IGNhdGNoIChnT1BEdGhyb3dzKSB7XG5cdFx0XHRcdHJldHVybiB0aHJvd1R5cGVFcnJvcjtcblx0XHRcdH1cblx0XHR9XG5cdH0oKSlcblx0OiB0aHJvd1R5cGVFcnJvcjtcblxudmFyIGhhc1N5bWJvbHMgPSByZXF1aXJlKCdoYXMtc3ltYm9scycpKCk7XG5cbnZhciBnZXRQcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZiB8fCBmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5fX3Byb3RvX187IH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tcHJvdG9cblxudmFyIG5lZWRzRXZhbCA9IHt9O1xuXG52YXIgVHlwZWRBcnJheSA9IHR5cGVvZiBVaW50OEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IGdldFByb3RvKFVpbnQ4QXJyYXkpO1xuXG52YXIgSU5UUklOU0lDUyA9IHtcblx0JyVBZ2dyZWdhdGVFcnJvciUnOiB0eXBlb2YgQWdncmVnYXRlRXJyb3IgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogQWdncmVnYXRlRXJyb3IsXG5cdCclQXJyYXklJzogQXJyYXksXG5cdCclQXJyYXlCdWZmZXIlJzogdHlwZW9mIEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEFycmF5QnVmZmVyLFxuXHQnJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlJzogaGFzU3ltYm9scyA/IGdldFByb3RvKFtdW1N5bWJvbC5pdGVyYXRvcl0oKSkgOiB1bmRlZmluZWQsXG5cdCclQXN5bmNGcm9tU3luY0l0ZXJhdG9yUHJvdG90eXBlJSc6IHVuZGVmaW5lZCxcblx0JyVBc3luY0Z1bmN0aW9uJSc6IG5lZWRzRXZhbCxcblx0JyVBc3luY0dlbmVyYXRvciUnOiBuZWVkc0V2YWwsXG5cdCclQXN5bmNHZW5lcmF0b3JGdW5jdGlvbiUnOiBuZWVkc0V2YWwsXG5cdCclQXN5bmNJdGVyYXRvclByb3RvdHlwZSUnOiBuZWVkc0V2YWwsXG5cdCclQXRvbWljcyUnOiB0eXBlb2YgQXRvbWljcyA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBBdG9taWNzLFxuXHQnJUJpZ0ludCUnOiB0eXBlb2YgQmlnSW50ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEJpZ0ludCxcblx0JyVCaWdJbnQ2NEFycmF5JSc6IHR5cGVvZiBCaWdJbnQ2NEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEJpZ0ludDY0QXJyYXksXG5cdCclQmlnVWludDY0QXJyYXklJzogdHlwZW9mIEJpZ1VpbnQ2NEFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEJpZ1VpbnQ2NEFycmF5LFxuXHQnJUJvb2xlYW4lJzogQm9vbGVhbixcblx0JyVEYXRhVmlldyUnOiB0eXBlb2YgRGF0YVZpZXcgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogRGF0YVZpZXcsXG5cdCclRGF0ZSUnOiBEYXRlLFxuXHQnJWRlY29kZVVSSSUnOiBkZWNvZGVVUkksXG5cdCclZGVjb2RlVVJJQ29tcG9uZW50JSc6IGRlY29kZVVSSUNvbXBvbmVudCxcblx0JyVlbmNvZGVVUkklJzogZW5jb2RlVVJJLFxuXHQnJWVuY29kZVVSSUNvbXBvbmVudCUnOiBlbmNvZGVVUklDb21wb25lbnQsXG5cdCclRXJyb3IlJzogRXJyb3IsXG5cdCclZXZhbCUnOiBldmFsLCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV2YWxcblx0JyVFdmFsRXJyb3IlJzogRXZhbEVycm9yLFxuXHQnJUZsb2F0MzJBcnJheSUnOiB0eXBlb2YgRmxvYXQzMkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEZsb2F0MzJBcnJheSxcblx0JyVGbG9hdDY0QXJyYXklJzogdHlwZW9mIEZsb2F0NjRBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBGbG9hdDY0QXJyYXksXG5cdCclRmluYWxpemF0aW9uUmVnaXN0cnklJzogdHlwZW9mIEZpbmFsaXphdGlvblJlZ2lzdHJ5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEZpbmFsaXphdGlvblJlZ2lzdHJ5LFxuXHQnJUZ1bmN0aW9uJSc6ICRGdW5jdGlvbixcblx0JyVHZW5lcmF0b3JGdW5jdGlvbiUnOiBuZWVkc0V2YWwsXG5cdCclSW50OEFycmF5JSc6IHR5cGVvZiBJbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogSW50OEFycmF5LFxuXHQnJUludDE2QXJyYXklJzogdHlwZW9mIEludDE2QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogSW50MTZBcnJheSxcblx0JyVJbnQzMkFycmF5JSc6IHR5cGVvZiBJbnQzMkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IEludDMyQXJyYXksXG5cdCclaXNGaW5pdGUlJzogaXNGaW5pdGUsXG5cdCclaXNOYU4lJzogaXNOYU4sXG5cdCclSXRlcmF0b3JQcm90b3R5cGUlJzogaGFzU3ltYm9scyA/IGdldFByb3RvKGdldFByb3RvKFtdW1N5bWJvbC5pdGVyYXRvcl0oKSkpIDogdW5kZWZpbmVkLFxuXHQnJUpTT04lJzogdHlwZW9mIEpTT04gPT09ICdvYmplY3QnID8gSlNPTiA6IHVuZGVmaW5lZCxcblx0JyVNYXAlJzogdHlwZW9mIE1hcCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBNYXAsXG5cdCclTWFwSXRlcmF0b3JQcm90b3R5cGUlJzogdHlwZW9mIE1hcCA9PT0gJ3VuZGVmaW5lZCcgfHwgIWhhc1N5bWJvbHMgPyB1bmRlZmluZWQgOiBnZXRQcm90byhuZXcgTWFwKClbU3ltYm9sLml0ZXJhdG9yXSgpKSxcblx0JyVNYXRoJSc6IE1hdGgsXG5cdCclTnVtYmVyJSc6IE51bWJlcixcblx0JyVPYmplY3QlJzogT2JqZWN0LFxuXHQnJXBhcnNlRmxvYXQlJzogcGFyc2VGbG9hdCxcblx0JyVwYXJzZUludCUnOiBwYXJzZUludCxcblx0JyVQcm9taXNlJSc6IHR5cGVvZiBQcm9taXNlID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFByb21pc2UsXG5cdCclUHJveHklJzogdHlwZW9mIFByb3h5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFByb3h5LFxuXHQnJVJhbmdlRXJyb3IlJzogUmFuZ2VFcnJvcixcblx0JyVSZWZlcmVuY2VFcnJvciUnOiBSZWZlcmVuY2VFcnJvcixcblx0JyVSZWZsZWN0JSc6IHR5cGVvZiBSZWZsZWN0ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFJlZmxlY3QsXG5cdCclUmVnRXhwJSc6IFJlZ0V4cCxcblx0JyVTZXQlJzogdHlwZW9mIFNldCA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBTZXQsXG5cdCclU2V0SXRlcmF0b3JQcm90b3R5cGUlJzogdHlwZW9mIFNldCA9PT0gJ3VuZGVmaW5lZCcgfHwgIWhhc1N5bWJvbHMgPyB1bmRlZmluZWQgOiBnZXRQcm90byhuZXcgU2V0KClbU3ltYm9sLml0ZXJhdG9yXSgpKSxcblx0JyVTaGFyZWRBcnJheUJ1ZmZlciUnOiB0eXBlb2YgU2hhcmVkQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogU2hhcmVkQXJyYXlCdWZmZXIsXG5cdCclU3RyaW5nJSc6IFN0cmluZyxcblx0JyVTdHJpbmdJdGVyYXRvclByb3RvdHlwZSUnOiBoYXNTeW1ib2xzID8gZ2V0UHJvdG8oJydbU3ltYm9sLml0ZXJhdG9yXSgpKSA6IHVuZGVmaW5lZCxcblx0JyVTeW1ib2wlJzogaGFzU3ltYm9scyA/IFN5bWJvbCA6IHVuZGVmaW5lZCxcblx0JyVTeW50YXhFcnJvciUnOiAkU3ludGF4RXJyb3IsXG5cdCclVGhyb3dUeXBlRXJyb3IlJzogVGhyb3dUeXBlRXJyb3IsXG5cdCclVHlwZWRBcnJheSUnOiBUeXBlZEFycmF5LFxuXHQnJVR5cGVFcnJvciUnOiAkVHlwZUVycm9yLFxuXHQnJVVpbnQ4QXJyYXklJzogdHlwZW9mIFVpbnQ4QXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogVWludDhBcnJheSxcblx0JyVVaW50OENsYW1wZWRBcnJheSUnOiB0eXBlb2YgVWludDhDbGFtcGVkQXJyYXkgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogVWludDhDbGFtcGVkQXJyYXksXG5cdCclVWludDE2QXJyYXklJzogdHlwZW9mIFVpbnQxNkFycmF5ID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFVpbnQxNkFycmF5LFxuXHQnJVVpbnQzMkFycmF5JSc6IHR5cGVvZiBVaW50MzJBcnJheSA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBVaW50MzJBcnJheSxcblx0JyVVUklFcnJvciUnOiBVUklFcnJvcixcblx0JyVXZWFrTWFwJSc6IHR5cGVvZiBXZWFrTWFwID09PSAndW5kZWZpbmVkJyA/IHVuZGVmaW5lZCA6IFdlYWtNYXAsXG5cdCclV2Vha1JlZiUnOiB0eXBlb2YgV2Vha1JlZiA9PT0gJ3VuZGVmaW5lZCcgPyB1bmRlZmluZWQgOiBXZWFrUmVmLFxuXHQnJVdlYWtTZXQlJzogdHlwZW9mIFdlYWtTZXQgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkIDogV2Vha1NldFxufTtcblxudHJ5IHtcblx0bnVsbC5lcnJvcjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bnVzZWQtZXhwcmVzc2lvbnNcbn0gY2F0Y2ggKGUpIHtcblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL3RjMzkvcHJvcG9zYWwtc2hhZG93cmVhbG0vcHVsbC8zODQjaXNzdWVjb21tZW50LTEzNjQyNjQyMjlcblx0dmFyIGVycm9yUHJvdG8gPSBnZXRQcm90byhnZXRQcm90byhlKSk7XG5cdElOVFJJTlNJQ1NbJyVFcnJvci5wcm90b3R5cGUlJ10gPSBlcnJvclByb3RvO1xufVxuXG52YXIgZG9FdmFsID0gZnVuY3Rpb24gZG9FdmFsKG5hbWUpIHtcblx0dmFyIHZhbHVlO1xuXHRpZiAobmFtZSA9PT0gJyVBc3luY0Z1bmN0aW9uJScpIHtcblx0XHR2YWx1ZSA9IGdldEV2YWxsZWRDb25zdHJ1Y3RvcignYXN5bmMgZnVuY3Rpb24gKCkge30nKTtcblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUdlbmVyYXRvckZ1bmN0aW9uJScpIHtcblx0XHR2YWx1ZSA9IGdldEV2YWxsZWRDb25zdHJ1Y3RvcignZnVuY3Rpb24qICgpIHt9Jyk7XG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJyVBc3luY0dlbmVyYXRvckZ1bmN0aW9uJScpIHtcblx0XHR2YWx1ZSA9IGdldEV2YWxsZWRDb25zdHJ1Y3RvcignYXN5bmMgZnVuY3Rpb24qICgpIHt9Jyk7XG5cdH0gZWxzZSBpZiAobmFtZSA9PT0gJyVBc3luY0dlbmVyYXRvciUnKSB7XG5cdFx0dmFyIGZuID0gZG9FdmFsKCclQXN5bmNHZW5lcmF0b3JGdW5jdGlvbiUnKTtcblx0XHRpZiAoZm4pIHtcblx0XHRcdHZhbHVlID0gZm4ucHJvdG90eXBlO1xuXHRcdH1cblx0fSBlbHNlIGlmIChuYW1lID09PSAnJUFzeW5jSXRlcmF0b3JQcm90b3R5cGUlJykge1xuXHRcdHZhciBnZW4gPSBkb0V2YWwoJyVBc3luY0dlbmVyYXRvciUnKTtcblx0XHRpZiAoZ2VuKSB7XG5cdFx0XHR2YWx1ZSA9IGdldFByb3RvKGdlbi5wcm90b3R5cGUpO1xuXHRcdH1cblx0fVxuXG5cdElOVFJJTlNJQ1NbbmFtZV0gPSB2YWx1ZTtcblxuXHRyZXR1cm4gdmFsdWU7XG59O1xuXG52YXIgTEVHQUNZX0FMSUFTRVMgPSB7XG5cdCclQXJyYXlCdWZmZXJQcm90b3R5cGUlJzogWydBcnJheUJ1ZmZlcicsICdwcm90b3R5cGUnXSxcblx0JyVBcnJheVByb3RvdHlwZSUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUFycmF5UHJvdG9fZW50cmllcyUnOiBbJ0FycmF5JywgJ3Byb3RvdHlwZScsICdlbnRyaWVzJ10sXG5cdCclQXJyYXlQcm90b19mb3JFYWNoJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ2ZvckVhY2gnXSxcblx0JyVBcnJheVByb3RvX2tleXMlJzogWydBcnJheScsICdwcm90b3R5cGUnLCAna2V5cyddLFxuXHQnJUFycmF5UHJvdG9fdmFsdWVzJSc6IFsnQXJyYXknLCAncHJvdG90eXBlJywgJ3ZhbHVlcyddLFxuXHQnJUFzeW5jRnVuY3Rpb25Qcm90b3R5cGUlJzogWydBc3luY0Z1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUFzeW5jR2VuZXJhdG9yJSc6IFsnQXN5bmNHZW5lcmF0b3JGdW5jdGlvbicsICdwcm90b3R5cGUnXSxcblx0JyVBc3luY0dlbmVyYXRvclByb3RvdHlwZSUnOiBbJ0FzeW5jR2VuZXJhdG9yRnVuY3Rpb24nLCAncHJvdG90eXBlJywgJ3Byb3RvdHlwZSddLFxuXHQnJUJvb2xlYW5Qcm90b3R5cGUlJzogWydCb29sZWFuJywgJ3Byb3RvdHlwZSddLFxuXHQnJURhdGFWaWV3UHJvdG90eXBlJSc6IFsnRGF0YVZpZXcnLCAncHJvdG90eXBlJ10sXG5cdCclRGF0ZVByb3RvdHlwZSUnOiBbJ0RhdGUnLCAncHJvdG90eXBlJ10sXG5cdCclRXJyb3JQcm90b3R5cGUlJzogWydFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVFdmFsRXJyb3JQcm90b3R5cGUlJzogWydFdmFsRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclRmxvYXQzMkFycmF5UHJvdG90eXBlJSc6IFsnRmxvYXQzMkFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJUZsb2F0NjRBcnJheVByb3RvdHlwZSUnOiBbJ0Zsb2F0NjRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVGdW5jdGlvblByb3RvdHlwZSUnOiBbJ0Z1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUdlbmVyYXRvciUnOiBbJ0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZSddLFxuXHQnJUdlbmVyYXRvclByb3RvdHlwZSUnOiBbJ0dlbmVyYXRvckZ1bmN0aW9uJywgJ3Byb3RvdHlwZScsICdwcm90b3R5cGUnXSxcblx0JyVJbnQ4QXJyYXlQcm90b3R5cGUlJzogWydJbnQ4QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSW50MTZBcnJheVByb3RvdHlwZSUnOiBbJ0ludDE2QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSW50MzJBcnJheVByb3RvdHlwZSUnOiBbJ0ludDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclSlNPTlBhcnNlJSc6IFsnSlNPTicsICdwYXJzZSddLFxuXHQnJUpTT05TdHJpbmdpZnklJzogWydKU09OJywgJ3N0cmluZ2lmeSddLFxuXHQnJU1hcFByb3RvdHlwZSUnOiBbJ01hcCcsICdwcm90b3R5cGUnXSxcblx0JyVOdW1iZXJQcm90b3R5cGUlJzogWydOdW1iZXInLCAncHJvdG90eXBlJ10sXG5cdCclT2JqZWN0UHJvdG90eXBlJSc6IFsnT2JqZWN0JywgJ3Byb3RvdHlwZSddLFxuXHQnJU9ialByb3RvX3RvU3RyaW5nJSc6IFsnT2JqZWN0JywgJ3Byb3RvdHlwZScsICd0b1N0cmluZyddLFxuXHQnJU9ialByb3RvX3ZhbHVlT2YlJzogWydPYmplY3QnLCAncHJvdG90eXBlJywgJ3ZhbHVlT2YnXSxcblx0JyVQcm9taXNlUHJvdG90eXBlJSc6IFsnUHJvbWlzZScsICdwcm90b3R5cGUnXSxcblx0JyVQcm9taXNlUHJvdG9fdGhlbiUnOiBbJ1Byb21pc2UnLCAncHJvdG90eXBlJywgJ3RoZW4nXSxcblx0JyVQcm9taXNlX2FsbCUnOiBbJ1Byb21pc2UnLCAnYWxsJ10sXG5cdCclUHJvbWlzZV9yZWplY3QlJzogWydQcm9taXNlJywgJ3JlamVjdCddLFxuXHQnJVByb21pc2VfcmVzb2x2ZSUnOiBbJ1Byb21pc2UnLCAncmVzb2x2ZSddLFxuXHQnJVJhbmdlRXJyb3JQcm90b3R5cGUlJzogWydSYW5nZUVycm9yJywgJ3Byb3RvdHlwZSddLFxuXHQnJVJlZmVyZW5jZUVycm9yUHJvdG90eXBlJSc6IFsnUmVmZXJlbmNlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclUmVnRXhwUHJvdG90eXBlJSc6IFsnUmVnRXhwJywgJ3Byb3RvdHlwZSddLFxuXHQnJVNldFByb3RvdHlwZSUnOiBbJ1NldCcsICdwcm90b3R5cGUnXSxcblx0JyVTaGFyZWRBcnJheUJ1ZmZlclByb3RvdHlwZSUnOiBbJ1NoYXJlZEFycmF5QnVmZmVyJywgJ3Byb3RvdHlwZSddLFxuXHQnJVN0cmluZ1Byb3RvdHlwZSUnOiBbJ1N0cmluZycsICdwcm90b3R5cGUnXSxcblx0JyVTeW1ib2xQcm90b3R5cGUlJzogWydTeW1ib2wnLCAncHJvdG90eXBlJ10sXG5cdCclU3ludGF4RXJyb3JQcm90b3R5cGUlJzogWydTeW50YXhFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVUeXBlZEFycmF5UHJvdG90eXBlJSc6IFsnVHlwZWRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVUeXBlRXJyb3JQcm90b3R5cGUlJzogWydUeXBlRXJyb3InLCAncHJvdG90eXBlJ10sXG5cdCclVWludDhBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQ4QXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVWludDhDbGFtcGVkQXJyYXlQcm90b3R5cGUlJzogWydVaW50OENsYW1wZWRBcnJheScsICdwcm90b3R5cGUnXSxcblx0JyVVaW50MTZBcnJheVByb3RvdHlwZSUnOiBbJ1VpbnQxNkFycmF5JywgJ3Byb3RvdHlwZSddLFxuXHQnJVVpbnQzMkFycmF5UHJvdG90eXBlJSc6IFsnVWludDMyQXJyYXknLCAncHJvdG90eXBlJ10sXG5cdCclVVJJRXJyb3JQcm90b3R5cGUlJzogWydVUklFcnJvcicsICdwcm90b3R5cGUnXSxcblx0JyVXZWFrTWFwUHJvdG90eXBlJSc6IFsnV2Vha01hcCcsICdwcm90b3R5cGUnXSxcblx0JyVXZWFrU2V0UHJvdG90eXBlJSc6IFsnV2Vha1NldCcsICdwcm90b3R5cGUnXVxufTtcblxudmFyIGJpbmQgPSByZXF1aXJlKCdmdW5jdGlvbi1iaW5kJyk7XG52YXIgaGFzT3duID0gcmVxdWlyZSgnaGFzJyk7XG52YXIgJGNvbmNhdCA9IGJpbmQuY2FsbChGdW5jdGlvbi5jYWxsLCBBcnJheS5wcm90b3R5cGUuY29uY2F0KTtcbnZhciAkc3BsaWNlQXBwbHkgPSBiaW5kLmNhbGwoRnVuY3Rpb24uYXBwbHksIEFycmF5LnByb3RvdHlwZS5zcGxpY2UpO1xudmFyICRyZXBsYWNlID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFN0cmluZy5wcm90b3R5cGUucmVwbGFjZSk7XG52YXIgJHN0clNsaWNlID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFN0cmluZy5wcm90b3R5cGUuc2xpY2UpO1xudmFyICRleGVjID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIFJlZ0V4cC5wcm90b3R5cGUuZXhlYyk7XG5cbi8qIGFkYXB0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iLzQuMTcuMTUvZGlzdC9sb2Rhc2guanMjTDY3MzUtTDY3NDQgKi9cbnZhciByZVByb3BOYW1lID0gL1teJS5bXFxdXSt8XFxbKD86KC0/XFxkKyg/OlxcLlxcZCspPyl8KFtcIiddKSgoPzooPyFcXDIpW15cXFxcXXxcXFxcLikqPylcXDIpXFxdfCg/PSg/OlxcLnxcXFtcXF0pKD86XFwufFxcW1xcXXwlJCkpL2c7XG52YXIgcmVFc2NhcGVDaGFyID0gL1xcXFwoXFxcXCk/L2c7IC8qKiBVc2VkIHRvIG1hdGNoIGJhY2tzbGFzaGVzIGluIHByb3BlcnR5IHBhdGhzLiAqL1xudmFyIHN0cmluZ1RvUGF0aCA9IGZ1bmN0aW9uIHN0cmluZ1RvUGF0aChzdHJpbmcpIHtcblx0dmFyIGZpcnN0ID0gJHN0clNsaWNlKHN0cmluZywgMCwgMSk7XG5cdHZhciBsYXN0ID0gJHN0clNsaWNlKHN0cmluZywgLTEpO1xuXHRpZiAoZmlyc3QgPT09ICclJyAmJiBsYXN0ICE9PSAnJScpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdpbnZhbGlkIGludHJpbnNpYyBzeW50YXgsIGV4cGVjdGVkIGNsb3NpbmcgYCVgJyk7XG5cdH0gZWxzZSBpZiAobGFzdCA9PT0gJyUnICYmIGZpcnN0ICE9PSAnJScpIHtcblx0XHR0aHJvdyBuZXcgJFN5bnRheEVycm9yKCdpbnZhbGlkIGludHJpbnNpYyBzeW50YXgsIGV4cGVjdGVkIG9wZW5pbmcgYCVgJyk7XG5cdH1cblx0dmFyIHJlc3VsdCA9IFtdO1xuXHQkcmVwbGFjZShzdHJpbmcsIHJlUHJvcE5hbWUsIGZ1bmN0aW9uIChtYXRjaCwgbnVtYmVyLCBxdW90ZSwgc3ViU3RyaW5nKSB7XG5cdFx0cmVzdWx0W3Jlc3VsdC5sZW5ndGhdID0gcXVvdGUgPyAkcmVwbGFjZShzdWJTdHJpbmcsIHJlRXNjYXBlQ2hhciwgJyQxJykgOiBudW1iZXIgfHwgbWF0Y2g7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufTtcbi8qIGVuZCBhZGFwdGF0aW9uICovXG5cbnZhciBnZXRCYXNlSW50cmluc2ljID0gZnVuY3Rpb24gZ2V0QmFzZUludHJpbnNpYyhuYW1lLCBhbGxvd01pc3NpbmcpIHtcblx0dmFyIGludHJpbnNpY05hbWUgPSBuYW1lO1xuXHR2YXIgYWxpYXM7XG5cdGlmIChoYXNPd24oTEVHQUNZX0FMSUFTRVMsIGludHJpbnNpY05hbWUpKSB7XG5cdFx0YWxpYXMgPSBMRUdBQ1lfQUxJQVNFU1tpbnRyaW5zaWNOYW1lXTtcblx0XHRpbnRyaW5zaWNOYW1lID0gJyUnICsgYWxpYXNbMF0gKyAnJSc7XG5cdH1cblxuXHRpZiAoaGFzT3duKElOVFJJTlNJQ1MsIGludHJpbnNpY05hbWUpKSB7XG5cdFx0dmFyIHZhbHVlID0gSU5UUklOU0lDU1tpbnRyaW5zaWNOYW1lXTtcblx0XHRpZiAodmFsdWUgPT09IG5lZWRzRXZhbCkge1xuXHRcdFx0dmFsdWUgPSBkb0V2YWwoaW50cmluc2ljTmFtZSk7XG5cdFx0fVxuXHRcdGlmICh0eXBlb2YgdmFsdWUgPT09ICd1bmRlZmluZWQnICYmICFhbGxvd01pc3NpbmcpIHtcblx0XHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdpbnRyaW5zaWMgJyArIG5hbWUgKyAnIGV4aXN0cywgYnV0IGlzIG5vdCBhdmFpbGFibGUuIFBsZWFzZSBmaWxlIGFuIGlzc3VlIScpO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRhbGlhczogYWxpYXMsXG5cdFx0XHRuYW1lOiBpbnRyaW5zaWNOYW1lLFxuXHRcdFx0dmFsdWU6IHZhbHVlXG5cdFx0fTtcblx0fVxuXG5cdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ2ludHJpbnNpYyAnICsgbmFtZSArICcgZG9lcyBub3QgZXhpc3QhJyk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIEdldEludHJpbnNpYyhuYW1lLCBhbGxvd01pc3NpbmcpIHtcblx0aWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJyB8fCBuYW1lLmxlbmd0aCA9PT0gMCkge1xuXHRcdHRocm93IG5ldyAkVHlwZUVycm9yKCdpbnRyaW5zaWMgbmFtZSBtdXN0IGJlIGEgbm9uLWVtcHR5IHN0cmluZycpO1xuXHR9XG5cdGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSAmJiB0eXBlb2YgYWxsb3dNaXNzaW5nICE9PSAnYm9vbGVhbicpIHtcblx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignXCJhbGxvd01pc3NpbmdcIiBhcmd1bWVudCBtdXN0IGJlIGEgYm9vbGVhbicpO1xuXHR9XG5cblx0aWYgKCRleGVjKC9eJT9bXiVdKiU/JC8sIG5hbWUpID09PSBudWxsKSB7XG5cdFx0dGhyb3cgbmV3ICRTeW50YXhFcnJvcignYCVgIG1heSBub3QgYmUgcHJlc2VudCBhbnl3aGVyZSBidXQgYXQgdGhlIGJlZ2lubmluZyBhbmQgZW5kIG9mIHRoZSBpbnRyaW5zaWMgbmFtZScpO1xuXHR9XG5cdHZhciBwYXJ0cyA9IHN0cmluZ1RvUGF0aChuYW1lKTtcblx0dmFyIGludHJpbnNpY0Jhc2VOYW1lID0gcGFydHMubGVuZ3RoID4gMCA/IHBhcnRzWzBdIDogJyc7XG5cblx0dmFyIGludHJpbnNpYyA9IGdldEJhc2VJbnRyaW5zaWMoJyUnICsgaW50cmluc2ljQmFzZU5hbWUgKyAnJScsIGFsbG93TWlzc2luZyk7XG5cdHZhciBpbnRyaW5zaWNSZWFsTmFtZSA9IGludHJpbnNpYy5uYW1lO1xuXHR2YXIgdmFsdWUgPSBpbnRyaW5zaWMudmFsdWU7XG5cdHZhciBza2lwRnVydGhlckNhY2hpbmcgPSBmYWxzZTtcblxuXHR2YXIgYWxpYXMgPSBpbnRyaW5zaWMuYWxpYXM7XG5cdGlmIChhbGlhcykge1xuXHRcdGludHJpbnNpY0Jhc2VOYW1lID0gYWxpYXNbMF07XG5cdFx0JHNwbGljZUFwcGx5KHBhcnRzLCAkY29uY2F0KFswLCAxXSwgYWxpYXMpKTtcblx0fVxuXG5cdGZvciAodmFyIGkgPSAxLCBpc093biA9IHRydWU7IGkgPCBwYXJ0cy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHNbaV07XG5cdFx0dmFyIGZpcnN0ID0gJHN0clNsaWNlKHBhcnQsIDAsIDEpO1xuXHRcdHZhciBsYXN0ID0gJHN0clNsaWNlKHBhcnQsIC0xKTtcblx0XHRpZiAoXG5cdFx0XHQoXG5cdFx0XHRcdChmaXJzdCA9PT0gJ1wiJyB8fCBmaXJzdCA9PT0gXCInXCIgfHwgZmlyc3QgPT09ICdgJylcblx0XHRcdFx0fHwgKGxhc3QgPT09ICdcIicgfHwgbGFzdCA9PT0gXCInXCIgfHwgbGFzdCA9PT0gJ2AnKVxuXHRcdFx0KVxuXHRcdFx0JiYgZmlyc3QgIT09IGxhc3Rcblx0XHQpIHtcblx0XHRcdHRocm93IG5ldyAkU3ludGF4RXJyb3IoJ3Byb3BlcnR5IG5hbWVzIHdpdGggcXVvdGVzIG11c3QgaGF2ZSBtYXRjaGluZyBxdW90ZXMnKTtcblx0XHR9XG5cdFx0aWYgKHBhcnQgPT09ICdjb25zdHJ1Y3RvcicgfHwgIWlzT3duKSB7XG5cdFx0XHRza2lwRnVydGhlckNhY2hpbmcgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGludHJpbnNpY0Jhc2VOYW1lICs9ICcuJyArIHBhcnQ7XG5cdFx0aW50cmluc2ljUmVhbE5hbWUgPSAnJScgKyBpbnRyaW5zaWNCYXNlTmFtZSArICclJztcblxuXHRcdGlmIChoYXNPd24oSU5UUklOU0lDUywgaW50cmluc2ljUmVhbE5hbWUpKSB7XG5cdFx0XHR2YWx1ZSA9IElOVFJJTlNJQ1NbaW50cmluc2ljUmVhbE5hbWVdO1xuXHRcdH0gZWxzZSBpZiAodmFsdWUgIT0gbnVsbCkge1xuXHRcdFx0aWYgKCEocGFydCBpbiB2YWx1ZSkpIHtcblx0XHRcdFx0aWYgKCFhbGxvd01pc3NpbmcpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgJFR5cGVFcnJvcignYmFzZSBpbnRyaW5zaWMgZm9yICcgKyBuYW1lICsgJyBleGlzdHMsIGJ1dCB0aGUgcHJvcGVydHkgaXMgbm90IGF2YWlsYWJsZS4nKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gdm9pZCB1bmRlZmluZWQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoJGdPUEQgJiYgKGkgKyAxKSA+PSBwYXJ0cy5sZW5ndGgpIHtcblx0XHRcdFx0dmFyIGRlc2MgPSAkZ09QRCh2YWx1ZSwgcGFydCk7XG5cdFx0XHRcdGlzT3duID0gISFkZXNjO1xuXG5cdFx0XHRcdC8vIEJ5IGNvbnZlbnRpb24sIHdoZW4gYSBkYXRhIHByb3BlcnR5IGlzIGNvbnZlcnRlZCB0byBhbiBhY2Nlc3NvclxuXHRcdFx0XHQvLyBwcm9wZXJ0eSB0byBlbXVsYXRlIGEgZGF0YSBwcm9wZXJ0eSB0aGF0IGRvZXMgbm90IHN1ZmZlciBmcm9tXG5cdFx0XHRcdC8vIHRoZSBvdmVycmlkZSBtaXN0YWtlLCB0aGF0IGFjY2Vzc29yJ3MgZ2V0dGVyIGlzIG1hcmtlZCB3aXRoXG5cdFx0XHRcdC8vIGFuIGBvcmlnaW5hbFZhbHVlYCBwcm9wZXJ0eS4gSGVyZSwgd2hlbiB3ZSBkZXRlY3QgdGhpcywgd2Vcblx0XHRcdFx0Ly8gdXBob2xkIHRoZSBpbGx1c2lvbiBieSBwcmV0ZW5kaW5nIHRvIHNlZSB0aGF0IG9yaWdpbmFsIGRhdGFcblx0XHRcdFx0Ly8gcHJvcGVydHksIGkuZS4sIHJldHVybmluZyB0aGUgdmFsdWUgcmF0aGVyIHRoYW4gdGhlIGdldHRlclxuXHRcdFx0XHQvLyBpdHNlbGYuXG5cdFx0XHRcdGlmIChpc093biAmJiAnZ2V0JyBpbiBkZXNjICYmICEoJ29yaWdpbmFsVmFsdWUnIGluIGRlc2MuZ2V0KSkge1xuXHRcdFx0XHRcdHZhbHVlID0gZGVzYy5nZXQ7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0dmFsdWUgPSB2YWx1ZVtwYXJ0XTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aXNPd24gPSBoYXNPd24odmFsdWUsIHBhcnQpO1xuXHRcdFx0XHR2YWx1ZSA9IHZhbHVlW3BhcnRdO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoaXNPd24gJiYgIXNraXBGdXJ0aGVyQ2FjaGluZykge1xuXHRcdFx0XHRJTlRSSU5TSUNTW2ludHJpbnNpY1JlYWxOYW1lXSA9IHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRyZXR1cm4gdmFsdWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgR2V0SW50cmluc2ljID0gcmVxdWlyZSgnZ2V0LWludHJpbnNpYycpO1xuXG52YXIgJGdPUEQgPSBHZXRJbnRyaW5zaWMoJyVPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yJScsIHRydWUpO1xuXG5pZiAoJGdPUEQpIHtcblx0dHJ5IHtcblx0XHQkZ09QRChbXSwgJ2xlbmd0aCcpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0Ly8gSUUgOCBoYXMgYSBicm9rZW4gZ09QRFxuXHRcdCRnT1BEID0gbnVsbDtcblx0fVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9ICRnT1BEO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgb3JpZ1N5bWJvbCA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbDtcbnZhciBoYXNTeW1ib2xTaGFtID0gcmVxdWlyZSgnLi9zaGFtcycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGhhc05hdGl2ZVN5bWJvbHMoKSB7XG5cdGlmICh0eXBlb2Ygb3JpZ1N5bWJvbCAhPT0gJ2Z1bmN0aW9uJykgeyByZXR1cm4gZmFsc2U7IH1cblx0aWYgKHR5cGVvZiBTeW1ib2wgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2Ygb3JpZ1N5bWJvbCgnZm9vJykgIT09ICdzeW1ib2wnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAodHlwZW9mIFN5bWJvbCgnYmFyJykgIT09ICdzeW1ib2wnKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdHJldHVybiBoYXNTeW1ib2xTaGFtKCk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG4vKiBlc2xpbnQgY29tcGxleGl0eTogWzIsIDE4XSwgbWF4LXN0YXRlbWVudHM6IFsyLCAzM10gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaGFzU3ltYm9scygpIHtcblx0aWYgKHR5cGVvZiBTeW1ib2wgIT09ICdmdW5jdGlvbicgfHwgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgIT09ICdmdW5jdGlvbicpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICh0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSAnc3ltYm9sJykgeyByZXR1cm4gdHJ1ZTsgfVxuXG5cdHZhciBvYmogPSB7fTtcblx0dmFyIHN5bSA9IFN5bWJvbCgndGVzdCcpO1xuXHR2YXIgc3ltT2JqID0gT2JqZWN0KHN5bSk7XG5cdGlmICh0eXBlb2Ygc3ltID09PSAnc3RyaW5nJykgeyByZXR1cm4gZmFsc2U7IH1cblxuXHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN5bSkgIT09ICdbb2JqZWN0IFN5bWJvbF0nKSB7IHJldHVybiBmYWxzZTsgfVxuXHRpZiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHN5bU9iaikgIT09ICdbb2JqZWN0IFN5bWJvbF0nKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdC8vIHRlbXAgZGlzYWJsZWQgcGVyIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvb2JqZWN0LmFzc2lnbi9pc3N1ZXMvMTdcblx0Ly8gaWYgKHN5bSBpbnN0YW5jZW9mIFN5bWJvbCkgeyByZXR1cm4gZmFsc2U7IH1cblx0Ly8gdGVtcCBkaXNhYmxlZCBwZXIgaHR0cHM6Ly9naXRodWIuY29tL1dlYlJlZmxlY3Rpb24vZ2V0LW93bi1wcm9wZXJ0eS1zeW1ib2xzL2lzc3Vlcy80XG5cdC8vIGlmICghKHN5bU9iaiBpbnN0YW5jZW9mIFN5bWJvbCkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0Ly8gaWYgKHR5cGVvZiBTeW1ib2wucHJvdG90eXBlLnRvU3RyaW5nICE9PSAnZnVuY3Rpb24nKSB7IHJldHVybiBmYWxzZTsgfVxuXHQvLyBpZiAoU3RyaW5nKHN5bSkgIT09IFN5bWJvbC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChzeW0pKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdHZhciBzeW1WYWwgPSA0Mjtcblx0b2JqW3N5bV0gPSBzeW1WYWw7XG5cdGZvciAoc3ltIGluIG9iaikgeyByZXR1cm4gZmFsc2U7IH0gLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1yZXN0cmljdGVkLXN5bnRheCwgbm8tdW5yZWFjaGFibGUtbG9vcFxuXHRpZiAodHlwZW9mIE9iamVjdC5rZXlzID09PSAnZnVuY3Rpb24nICYmIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoICE9PSAwKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMgPT09ICdmdW5jdGlvbicgJiYgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMob2JqKS5sZW5ndGggIT09IDApIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0dmFyIHN5bXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKG9iaik7XG5cdGlmIChzeW1zLmxlbmd0aCAhPT0gMSB8fCBzeW1zWzBdICE9PSBzeW0pIHsgcmV0dXJuIGZhbHNlOyB9XG5cblx0aWYgKCFPYmplY3QucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqLCBzeW0pKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdGlmICh0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvciA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHZhciBkZXNjcmlwdG9yID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIHN5bSk7XG5cdFx0aWYgKGRlc2NyaXB0b3IudmFsdWUgIT09IHN5bVZhbCB8fCBkZXNjcmlwdG9yLmVudW1lcmFibGUgIT09IHRydWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdH1cblxuXHRyZXR1cm4gdHJ1ZTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBoYXNTeW1ib2xzID0gcmVxdWlyZSgnaGFzLXN5bWJvbHMvc2hhbXMnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBoYXNUb1N0cmluZ1RhZ1NoYW1zKCkge1xuXHRyZXR1cm4gaGFzU3ltYm9scygpICYmICEhU3ltYm9sLnRvU3RyaW5nVGFnO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGJpbmQgPSByZXF1aXJlKCdmdW5jdGlvbi1iaW5kJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gYmluZC5jYWxsKEZ1bmN0aW9uLmNhbGwsIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkpO1xuIiwiLyohIGllZWU3NTQuIEJTRC0zLUNsYXVzZSBMaWNlbnNlLiBGZXJvc3MgQWJvdWtoYWRpamVoIDxodHRwczovL2Zlcm9zcy5vcmcvb3BlbnNvdXJjZT4gKi9cbmV4cG9ydHMucmVhZCA9IGZ1bmN0aW9uIChidWZmZXIsIG9mZnNldCwgaXNMRSwgbUxlbiwgbkJ5dGVzKSB7XG4gIHZhciBlLCBtXG4gIHZhciBlTGVuID0gKG5CeXRlcyAqIDgpIC0gbUxlbiAtIDFcbiAgdmFyIGVNYXggPSAoMSA8PCBlTGVuKSAtIDFcbiAgdmFyIGVCaWFzID0gZU1heCA+PiAxXG4gIHZhciBuQml0cyA9IC03XG4gIHZhciBpID0gaXNMRSA/IChuQnl0ZXMgLSAxKSA6IDBcbiAgdmFyIGQgPSBpc0xFID8gLTEgOiAxXG4gIHZhciBzID0gYnVmZmVyW29mZnNldCArIGldXG5cbiAgaSArPSBkXG5cbiAgZSA9IHMgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgcyA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gZUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBlID0gKGUgKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgbSA9IGUgJiAoKDEgPDwgKC1uQml0cykpIC0gMSlcbiAgZSA+Pj0gKC1uQml0cylcbiAgbkJpdHMgKz0gbUxlblxuICBmb3IgKDsgbkJpdHMgPiAwOyBtID0gKG0gKiAyNTYpICsgYnVmZmVyW29mZnNldCArIGldLCBpICs9IGQsIG5CaXRzIC09IDgpIHt9XG5cbiAgaWYgKGUgPT09IDApIHtcbiAgICBlID0gMSAtIGVCaWFzXG4gIH0gZWxzZSBpZiAoZSA9PT0gZU1heCkge1xuICAgIHJldHVybiBtID8gTmFOIDogKChzID8gLTEgOiAxKSAqIEluZmluaXR5KVxuICB9IGVsc2Uge1xuICAgIG0gPSBtICsgTWF0aC5wb3coMiwgbUxlbilcbiAgICBlID0gZSAtIGVCaWFzXG4gIH1cbiAgcmV0dXJuIChzID8gLTEgOiAxKSAqIG0gKiBNYXRoLnBvdygyLCBlIC0gbUxlbilcbn1cblxuZXhwb3J0cy53cml0ZSA9IGZ1bmN0aW9uIChidWZmZXIsIHZhbHVlLCBvZmZzZXQsIGlzTEUsIG1MZW4sIG5CeXRlcykge1xuICB2YXIgZSwgbSwgY1xuICB2YXIgZUxlbiA9IChuQnl0ZXMgKiA4KSAtIG1MZW4gLSAxXG4gIHZhciBlTWF4ID0gKDEgPDwgZUxlbikgLSAxXG4gIHZhciBlQmlhcyA9IGVNYXggPj4gMVxuICB2YXIgcnQgPSAobUxlbiA9PT0gMjMgPyBNYXRoLnBvdygyLCAtMjQpIC0gTWF0aC5wb3coMiwgLTc3KSA6IDApXG4gIHZhciBpID0gaXNMRSA/IDAgOiAobkJ5dGVzIC0gMSlcbiAgdmFyIGQgPSBpc0xFID8gMSA6IC0xXG4gIHZhciBzID0gdmFsdWUgPCAwIHx8ICh2YWx1ZSA9PT0gMCAmJiAxIC8gdmFsdWUgPCAwKSA/IDEgOiAwXG5cbiAgdmFsdWUgPSBNYXRoLmFicyh2YWx1ZSlcblxuICBpZiAoaXNOYU4odmFsdWUpIHx8IHZhbHVlID09PSBJbmZpbml0eSkge1xuICAgIG0gPSBpc05hTih2YWx1ZSkgPyAxIDogMFxuICAgIGUgPSBlTWF4XG4gIH0gZWxzZSB7XG4gICAgZSA9IE1hdGguZmxvb3IoTWF0aC5sb2codmFsdWUpIC8gTWF0aC5MTjIpXG4gICAgaWYgKHZhbHVlICogKGMgPSBNYXRoLnBvdygyLCAtZSkpIDwgMSkge1xuICAgICAgZS0tXG4gICAgICBjICo9IDJcbiAgICB9XG4gICAgaWYgKGUgKyBlQmlhcyA+PSAxKSB7XG4gICAgICB2YWx1ZSArPSBydCAvIGNcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgKz0gcnQgKiBNYXRoLnBvdygyLCAxIC0gZUJpYXMpXG4gICAgfVxuICAgIGlmICh2YWx1ZSAqIGMgPj0gMikge1xuICAgICAgZSsrXG4gICAgICBjIC89IDJcbiAgICB9XG5cbiAgICBpZiAoZSArIGVCaWFzID49IGVNYXgpIHtcbiAgICAgIG0gPSAwXG4gICAgICBlID0gZU1heFxuICAgIH0gZWxzZSBpZiAoZSArIGVCaWFzID49IDEpIHtcbiAgICAgIG0gPSAoKHZhbHVlICogYykgLSAxKSAqIE1hdGgucG93KDIsIG1MZW4pXG4gICAgICBlID0gZSArIGVCaWFzXG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSB2YWx1ZSAqIE1hdGgucG93KDIsIGVCaWFzIC0gMSkgKiBNYXRoLnBvdygyLCBtTGVuKVxuICAgICAgZSA9IDBcbiAgICB9XG4gIH1cblxuICBmb3IgKDsgbUxlbiA+PSA4OyBidWZmZXJbb2Zmc2V0ICsgaV0gPSBtICYgMHhmZiwgaSArPSBkLCBtIC89IDI1NiwgbUxlbiAtPSA4KSB7fVxuXG4gIGUgPSAoZSA8PCBtTGVuKSB8IG1cbiAgZUxlbiArPSBtTGVuXG4gIGZvciAoOyBlTGVuID4gMDsgYnVmZmVyW29mZnNldCArIGldID0gZSAmIDB4ZmYsIGkgKz0gZCwgZSAvPSAyNTYsIGVMZW4gLT0gOCkge31cblxuICBidWZmZXJbb2Zmc2V0ICsgaSAtIGRdIHw9IHMgKiAxMjhcbn1cbiIsImlmICh0eXBlb2YgT2JqZWN0LmNyZWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAvLyBpbXBsZW1lbnRhdGlvbiBmcm9tIHN0YW5kYXJkIG5vZGUuanMgJ3V0aWwnIG1vZHVsZVxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGlmIChzdXBlckN0b3IpIHtcbiAgICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgICBjb25zdHJ1Y3Rvcjoge1xuICAgICAgICAgIHZhbHVlOiBjdG9yLFxuICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgfTtcbn0gZWxzZSB7XG4gIC8vIG9sZCBzY2hvb2wgc2hpbSBmb3Igb2xkIGJyb3dzZXJzXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgaWYgKHN1cGVyQ3Rvcikge1xuICAgICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICAgIHZhciBUZW1wQ3RvciA9IGZ1bmN0aW9uICgpIHt9XG4gICAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgICBjdG9yLnByb3RvdHlwZSA9IG5ldyBUZW1wQ3RvcigpXG4gICAgICBjdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGN0b3JcbiAgICB9XG4gIH1cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc1RvU3RyaW5nVGFnID0gcmVxdWlyZSgnaGFzLXRvc3RyaW5ndGFnL3NoYW1zJykoKTtcbnZhciBjYWxsQm91bmQgPSByZXF1aXJlKCdjYWxsLWJpbmQvY2FsbEJvdW5kJyk7XG5cbnZhciAkdG9TdHJpbmcgPSBjYWxsQm91bmQoJ09iamVjdC5wcm90b3R5cGUudG9TdHJpbmcnKTtcblxudmFyIGlzU3RhbmRhcmRBcmd1bWVudHMgPSBmdW5jdGlvbiBpc0FyZ3VtZW50cyh2YWx1ZSkge1xuXHRpZiAoaGFzVG9TdHJpbmdUYWcgJiYgdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiBTeW1ib2wudG9TdHJpbmdUYWcgaW4gdmFsdWUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cblx0cmV0dXJuICR0b1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IEFyZ3VtZW50c10nO1xufTtcblxudmFyIGlzTGVnYWN5QXJndW1lbnRzID0gZnVuY3Rpb24gaXNBcmd1bWVudHModmFsdWUpIHtcblx0aWYgKGlzU3RhbmRhcmRBcmd1bWVudHModmFsdWUpKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblx0cmV0dXJuIHZhbHVlICE9PSBudWxsICYmXG5cdFx0dHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJlxuXHRcdHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInICYmXG5cdFx0dmFsdWUubGVuZ3RoID49IDAgJiZcblx0XHQkdG9TdHJpbmcodmFsdWUpICE9PSAnW29iamVjdCBBcnJheV0nICYmXG5cdFx0JHRvU3RyaW5nKHZhbHVlLmNhbGxlZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG59O1xuXG52YXIgc3VwcG9ydHNTdGFuZGFyZEFyZ3VtZW50cyA9IChmdW5jdGlvbiAoKSB7XG5cdHJldHVybiBpc1N0YW5kYXJkQXJndW1lbnRzKGFyZ3VtZW50cyk7XG59KCkpO1xuXG5pc1N0YW5kYXJkQXJndW1lbnRzLmlzTGVnYWN5QXJndW1lbnRzID0gaXNMZWdhY3lBcmd1bWVudHM7IC8vIGZvciB0ZXN0c1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN1cHBvcnRzU3RhbmRhcmRBcmd1bWVudHMgPyBpc1N0YW5kYXJkQXJndW1lbnRzIDogaXNMZWdhY3lBcmd1bWVudHM7XG4iLCIvKiFcbiAqIERldGVybWluZSBpZiBhbiBvYmplY3QgaXMgYSBCdWZmZXJcbiAqXG4gKiBAYXV0aG9yICAgRmVyb3NzIEFib3VraGFkaWplaCA8aHR0cHM6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5cbi8vIFRoZSBfaXNCdWZmZXIgY2hlY2sgaXMgZm9yIFNhZmFyaSA1LTcgc3VwcG9ydCwgYmVjYXVzZSBpdCdzIG1pc3Npbmdcbi8vIE9iamVjdC5wcm90b3R5cGUuY29uc3RydWN0b3IuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaikge1xuICByZXR1cm4gb2JqICE9IG51bGwgJiYgKGlzQnVmZmVyKG9iaikgfHwgaXNTbG93QnVmZmVyKG9iaikgfHwgISFvYmouX2lzQnVmZmVyKVxufVxuXG5mdW5jdGlvbiBpc0J1ZmZlciAob2JqKSB7XG4gIHJldHVybiAhIW9iai5jb25zdHJ1Y3RvciAmJiB0eXBlb2Ygb2JqLmNvbnN0cnVjdG9yLmlzQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlcihvYmopXG59XG5cbi8vIEZvciBOb2RlIHYwLjEwIHN1cHBvcnQuIFJlbW92ZSB0aGlzIGV2ZW50dWFsbHkuXG5mdW5jdGlvbiBpc1Nsb3dCdWZmZXIgKG9iaikge1xuICByZXR1cm4gdHlwZW9mIG9iai5yZWFkRmxvYXRMRSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygb2JqLnNsaWNlID09PSAnZnVuY3Rpb24nICYmIGlzQnVmZmVyKG9iai5zbGljZSgwLCAwKSlcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGZuVG9TdHIgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgcmVmbGVjdEFwcGx5ID0gdHlwZW9mIFJlZmxlY3QgPT09ICdvYmplY3QnICYmIFJlZmxlY3QgIT09IG51bGwgJiYgUmVmbGVjdC5hcHBseTtcbnZhciBiYWRBcnJheUxpa2U7XG52YXIgaXNDYWxsYWJsZU1hcmtlcjtcbmlmICh0eXBlb2YgcmVmbGVjdEFwcGx5ID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBPYmplY3QuZGVmaW5lUHJvcGVydHkgPT09ICdmdW5jdGlvbicpIHtcblx0dHJ5IHtcblx0XHRiYWRBcnJheUxpa2UgPSBPYmplY3QuZGVmaW5lUHJvcGVydHkoe30sICdsZW5ndGgnLCB7XG5cdFx0XHRnZXQ6IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dGhyb3cgaXNDYWxsYWJsZU1hcmtlcjtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpc0NhbGxhYmxlTWFya2VyID0ge307XG5cdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXRocm93LWxpdGVyYWxcblx0XHRyZWZsZWN0QXBwbHkoZnVuY3Rpb24gKCkgeyB0aHJvdyA0MjsgfSwgbnVsbCwgYmFkQXJyYXlMaWtlKTtcblx0fSBjYXRjaCAoXykge1xuXHRcdGlmIChfICE9PSBpc0NhbGxhYmxlTWFya2VyKSB7XG5cdFx0XHRyZWZsZWN0QXBwbHkgPSBudWxsO1xuXHRcdH1cblx0fVxufSBlbHNlIHtcblx0cmVmbGVjdEFwcGx5ID0gbnVsbDtcbn1cblxudmFyIGNvbnN0cnVjdG9yUmVnZXggPSAvXlxccypjbGFzc1xcYi87XG52YXIgaXNFUzZDbGFzc0ZuID0gZnVuY3Rpb24gaXNFUzZDbGFzc0Z1bmN0aW9uKHZhbHVlKSB7XG5cdHRyeSB7XG5cdFx0dmFyIGZuU3RyID0gZm5Ub1N0ci5jYWxsKHZhbHVlKTtcblx0XHRyZXR1cm4gY29uc3RydWN0b3JSZWdleC50ZXN0KGZuU3RyKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdHJldHVybiBmYWxzZTsgLy8gbm90IGEgZnVuY3Rpb25cblx0fVxufTtcblxudmFyIHRyeUZ1bmN0aW9uT2JqZWN0ID0gZnVuY3Rpb24gdHJ5RnVuY3Rpb25Ub1N0cih2YWx1ZSkge1xuXHR0cnkge1xuXHRcdGlmIChpc0VTNkNsYXNzRm4odmFsdWUpKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdGZuVG9TdHIuY2FsbCh2YWx1ZSk7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0gY2F0Y2ggKGUpIHtcblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn07XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIG9iamVjdENsYXNzID0gJ1tvYmplY3QgT2JqZWN0XSc7XG52YXIgZm5DbGFzcyA9ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG52YXIgZ2VuQ2xhc3MgPSAnW29iamVjdCBHZW5lcmF0b3JGdW5jdGlvbl0nO1xudmFyIGRkYUNsYXNzID0gJ1tvYmplY3QgSFRNTEFsbENvbGxlY3Rpb25dJzsgLy8gSUUgMTFcbnZhciBkZGFDbGFzczIgPSAnW29iamVjdCBIVE1MIGRvY3VtZW50LmFsbCBjbGFzc10nO1xudmFyIGRkYUNsYXNzMyA9ICdbb2JqZWN0IEhUTUxDb2xsZWN0aW9uXSc7IC8vIElFIDktMTBcbnZhciBoYXNUb1N0cmluZ1RhZyA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgISFTeW1ib2wudG9TdHJpbmdUYWc7IC8vIGJldHRlcjogdXNlIGBoYXMtdG9zdHJpbmd0YWdgXG5cbnZhciBpc0lFNjggPSAhKDAgaW4gWyxdKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1zcGFyc2UtYXJyYXlzLCBjb21tYS1zcGFjaW5nXG5cbnZhciBpc0REQSA9IGZ1bmN0aW9uIGlzRG9jdW1lbnREb3RBbGwoKSB7IHJldHVybiBmYWxzZTsgfTtcbmlmICh0eXBlb2YgZG9jdW1lbnQgPT09ICdvYmplY3QnKSB7XG5cdC8vIEZpcmVmb3ggMyBjYW5vbmljYWxpemVzIEREQSB0byB1bmRlZmluZWQgd2hlbiBpdCdzIG5vdCBhY2Nlc3NlZCBkaXJlY3RseVxuXHR2YXIgYWxsID0gZG9jdW1lbnQuYWxsO1xuXHRpZiAodG9TdHIuY2FsbChhbGwpID09PSB0b1N0ci5jYWxsKGRvY3VtZW50LmFsbCkpIHtcblx0XHRpc0REQSA9IGZ1bmN0aW9uIGlzRG9jdW1lbnREb3RBbGwodmFsdWUpIHtcblx0XHRcdC8qIGdsb2JhbHMgZG9jdW1lbnQ6IGZhbHNlICovXG5cdFx0XHQvLyBpbiBJRSA2LTgsIHR5cGVvZiBkb2N1bWVudC5hbGwgaXMgXCJvYmplY3RcIiBhbmQgaXQncyB0cnV0aHlcblx0XHRcdGlmICgoaXNJRTY4IHx8ICF2YWx1ZSkgJiYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JykpIHtcblx0XHRcdFx0dHJ5IHtcblx0XHRcdFx0XHR2YXIgc3RyID0gdG9TdHIuY2FsbCh2YWx1ZSk7XG5cdFx0XHRcdFx0cmV0dXJuIChcblx0XHRcdFx0XHRcdHN0ciA9PT0gZGRhQ2xhc3Ncblx0XHRcdFx0XHRcdHx8IHN0ciA9PT0gZGRhQ2xhc3MyXG5cdFx0XHRcdFx0XHR8fCBzdHIgPT09IGRkYUNsYXNzMyAvLyBvcGVyYSAxMi4xNlxuXHRcdFx0XHRcdFx0fHwgc3RyID09PSBvYmplY3RDbGFzcyAvLyBJRSA2LThcblx0XHRcdFx0XHQpICYmIHZhbHVlKCcnKSA9PSBudWxsOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuXHRcdFx0XHR9IGNhdGNoIChlKSB7IC8qKi8gfVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH07XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSByZWZsZWN0QXBwbHlcblx0PyBmdW5jdGlvbiBpc0NhbGxhYmxlKHZhbHVlKSB7XG5cdFx0aWYgKGlzRERBKHZhbHVlKSkgeyByZXR1cm4gdHJ1ZTsgfVxuXHRcdGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdHRyeSB7XG5cdFx0XHRyZWZsZWN0QXBwbHkodmFsdWUsIG51bGwsIGJhZEFycmF5TGlrZSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKGUgIT09IGlzQ2FsbGFibGVNYXJrZXIpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0fVxuXHRcdHJldHVybiAhaXNFUzZDbGFzc0ZuKHZhbHVlKSAmJiB0cnlGdW5jdGlvbk9iamVjdCh2YWx1ZSk7XG5cdH1cblx0OiBmdW5jdGlvbiBpc0NhbGxhYmxlKHZhbHVlKSB7XG5cdFx0aWYgKGlzRERBKHZhbHVlKSkgeyByZXR1cm4gdHJ1ZTsgfVxuXHRcdGlmICghdmFsdWUpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0aWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7IHJldHVybiBmYWxzZTsgfVxuXHRcdGlmIChoYXNUb1N0cmluZ1RhZykgeyByZXR1cm4gdHJ5RnVuY3Rpb25PYmplY3QodmFsdWUpOyB9XG5cdFx0aWYgKGlzRVM2Q2xhc3NGbih2YWx1ZSkpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdFx0dmFyIHN0ckNsYXNzID0gdG9TdHIuY2FsbCh2YWx1ZSk7XG5cdFx0aWYgKHN0ckNsYXNzICE9PSBmbkNsYXNzICYmIHN0ckNsYXNzICE9PSBnZW5DbGFzcyAmJiAhKC9eXFxbb2JqZWN0IEhUTUwvKS50ZXN0KHN0ckNsYXNzKSkgeyByZXR1cm4gZmFsc2U7IH1cblx0XHRyZXR1cm4gdHJ5RnVuY3Rpb25PYmplY3QodmFsdWUpO1xuXHR9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGZuVG9TdHIgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG52YXIgaXNGblJlZ2V4ID0gL15cXHMqKD86ZnVuY3Rpb24pP1xcKi87XG52YXIgaGFzVG9TdHJpbmdUYWcgPSByZXF1aXJlKCdoYXMtdG9zdHJpbmd0YWcvc2hhbXMnKSgpO1xudmFyIGdldFByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mO1xudmFyIGdldEdlbmVyYXRvckZ1bmMgPSBmdW5jdGlvbiAoKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cblx0aWYgKCFoYXNUb1N0cmluZ1RhZykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHR0cnkge1xuXHRcdHJldHVybiBGdW5jdGlvbigncmV0dXJuIGZ1bmN0aW9uKigpIHt9JykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHR9XG59O1xudmFyIEdlbmVyYXRvckZ1bmN0aW9uO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzR2VuZXJhdG9yRnVuY3Rpb24oZm4pIHtcblx0aWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRpZiAoaXNGblJlZ2V4LnRlc3QoZm5Ub1N0ci5jYWxsKGZuKSkpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXHRpZiAoIWhhc1RvU3RyaW5nVGFnKSB7XG5cdFx0dmFyIHN0ciA9IHRvU3RyLmNhbGwoZm4pO1xuXHRcdHJldHVybiBzdHIgPT09ICdbb2JqZWN0IEdlbmVyYXRvckZ1bmN0aW9uXSc7XG5cdH1cblx0aWYgKCFnZXRQcm90bykge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxuXHRpZiAodHlwZW9mIEdlbmVyYXRvckZ1bmN0aW9uID09PSAndW5kZWZpbmVkJykge1xuXHRcdHZhciBnZW5lcmF0b3JGdW5jID0gZ2V0R2VuZXJhdG9yRnVuYygpO1xuXHRcdEdlbmVyYXRvckZ1bmN0aW9uID0gZ2VuZXJhdG9yRnVuYyA/IGdldFByb3RvKGdlbmVyYXRvckZ1bmMpIDogZmFsc2U7XG5cdH1cblx0cmV0dXJuIGdldFByb3RvKGZuKSA9PT0gR2VuZXJhdG9yRnVuY3Rpb247XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgd2hpY2hUeXBlZEFycmF5ID0gcmVxdWlyZSgnd2hpY2gtdHlwZWQtYXJyYXknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBpc1R5cGVkQXJyYXkodmFsdWUpIHtcblx0cmV0dXJuICEhd2hpY2hUeXBlZEFycmF5KHZhbHVlKTtcbn07XG4iLCIvLyAncGF0aCcgbW9kdWxlIGV4dHJhY3RlZCBmcm9tIE5vZGUuanMgdjguMTEuMSAob25seSB0aGUgcG9zaXggcGFydClcbi8vIHRyYW5zcGxpdGVkIHdpdGggQmFiZWxcblxuLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gYXNzZXJ0UGF0aChwYXRoKSB7XG4gIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICcgKyBKU09OLnN0cmluZ2lmeShwYXRoKSk7XG4gIH1cbn1cblxuLy8gUmVzb2x2ZXMgLiBhbmQgLi4gZWxlbWVudHMgaW4gYSBwYXRoIHdpdGggZGlyZWN0b3J5IG5hbWVzXG5mdW5jdGlvbiBub3JtYWxpemVTdHJpbmdQb3NpeChwYXRoLCBhbGxvd0Fib3ZlUm9vdCkge1xuICB2YXIgcmVzID0gJyc7XG4gIHZhciBsYXN0U2VnbWVudExlbmd0aCA9IDA7XG4gIHZhciBsYXN0U2xhc2ggPSAtMTtcbiAgdmFyIGRvdHMgPSAwO1xuICB2YXIgY29kZTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPD0gcGF0aC5sZW5ndGg7ICsraSkge1xuICAgIGlmIChpIDwgcGF0aC5sZW5ndGgpXG4gICAgICBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGVsc2UgaWYgKGNvZGUgPT09IDQ3IC8qLyovKVxuICAgICAgYnJlYWs7XG4gICAgZWxzZVxuICAgICAgY29kZSA9IDQ3IC8qLyovO1xuICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgaWYgKGxhc3RTbGFzaCA9PT0gaSAtIDEgfHwgZG90cyA9PT0gMSkge1xuICAgICAgICAvLyBOT09QXG4gICAgICB9IGVsc2UgaWYgKGxhc3RTbGFzaCAhPT0gaSAtIDEgJiYgZG90cyA9PT0gMikge1xuICAgICAgICBpZiAocmVzLmxlbmd0aCA8IDIgfHwgbGFzdFNlZ21lbnRMZW5ndGggIT09IDIgfHwgcmVzLmNoYXJDb2RlQXQocmVzLmxlbmd0aCAtIDEpICE9PSA0NiAvKi4qLyB8fCByZXMuY2hhckNvZGVBdChyZXMubGVuZ3RoIC0gMikgIT09IDQ2IC8qLiovKSB7XG4gICAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAyKSB7XG4gICAgICAgICAgICB2YXIgbGFzdFNsYXNoSW5kZXggPSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIGlmIChsYXN0U2xhc2hJbmRleCAhPT0gcmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgaWYgKGxhc3RTbGFzaEluZGV4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXMgPSByZXMuc2xpY2UoMCwgbGFzdFNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gcmVzLmxlbmd0aCAtIDEgLSByZXMubGFzdEluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBsYXN0U2xhc2ggPSBpO1xuICAgICAgICAgICAgICBkb3RzID0gMDtcbiAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChyZXMubGVuZ3RoID09PSAyIHx8IHJlcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIHJlcyA9ICcnO1xuICAgICAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSAwO1xuICAgICAgICAgICAgbGFzdFNsYXNoID0gaTtcbiAgICAgICAgICAgIGRvdHMgPSAwO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChhbGxvd0Fib3ZlUm9vdCkge1xuICAgICAgICAgIGlmIChyZXMubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHJlcyArPSAnLy4uJztcbiAgICAgICAgICBlbHNlXG4gICAgICAgICAgICByZXMgPSAnLi4nO1xuICAgICAgICAgIGxhc3RTZWdtZW50TGVuZ3RoID0gMjtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKVxuICAgICAgICAgIHJlcyArPSAnLycgKyBwYXRoLnNsaWNlKGxhc3RTbGFzaCArIDEsIGkpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmVzID0gcGF0aC5zbGljZShsYXN0U2xhc2ggKyAxLCBpKTtcbiAgICAgICAgbGFzdFNlZ21lbnRMZW5ndGggPSBpIC0gbGFzdFNsYXNoIC0gMTtcbiAgICAgIH1cbiAgICAgIGxhc3RTbGFzaCA9IGk7XG4gICAgICBkb3RzID0gMDtcbiAgICB9IGVsc2UgaWYgKGNvZGUgPT09IDQ2IC8qLiovICYmIGRvdHMgIT09IC0xKSB7XG4gICAgICArK2RvdHM7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvdHMgPSAtMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gX2Zvcm1hdChzZXAsIHBhdGhPYmplY3QpIHtcbiAgdmFyIGRpciA9IHBhdGhPYmplY3QuZGlyIHx8IHBhdGhPYmplY3Qucm9vdDtcbiAgdmFyIGJhc2UgPSBwYXRoT2JqZWN0LmJhc2UgfHwgKHBhdGhPYmplY3QubmFtZSB8fCAnJykgKyAocGF0aE9iamVjdC5leHQgfHwgJycpO1xuICBpZiAoIWRpcikge1xuICAgIHJldHVybiBiYXNlO1xuICB9XG4gIGlmIChkaXIgPT09IHBhdGhPYmplY3Qucm9vdCkge1xuICAgIHJldHVybiBkaXIgKyBiYXNlO1xuICB9XG4gIHJldHVybiBkaXIgKyBzZXAgKyBiYXNlO1xufVxuXG52YXIgcG9zaXggPSB7XG4gIC8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbiAgcmVzb2x2ZTogZnVuY3Rpb24gcmVzb2x2ZSgpIHtcbiAgICB2YXIgcmVzb2x2ZWRQYXRoID0gJyc7XG4gICAgdmFyIHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcbiAgICB2YXIgY3dkO1xuXG4gICAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICAgIHZhciBwYXRoO1xuICAgICAgaWYgKGkgPj0gMClcbiAgICAgICAgcGF0aCA9IGFyZ3VtZW50c1tpXTtcbiAgICAgIGVsc2Uge1xuICAgICAgICBpZiAoY3dkID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgY3dkID0gcHJvY2Vzcy5jd2QoKTtcbiAgICAgICAgcGF0aCA9IGN3ZDtcbiAgICAgIH1cblxuICAgICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgICAgLy8gU2tpcCBlbXB0eSBlbnRyaWVzXG4gICAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIHJlc29sdmVkUGF0aCA9IHBhdGggKyAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgICB9XG5cbiAgICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCwgYnV0XG4gICAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgICAvLyBOb3JtYWxpemUgdGhlIHBhdGhcbiAgICByZXNvbHZlZFBhdGggPSBub3JtYWxpemVTdHJpbmdQb3NpeChyZXNvbHZlZFBhdGgsICFyZXNvbHZlZEFic29sdXRlKTtcblxuICAgIGlmIChyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgICBpZiAocmVzb2x2ZWRQYXRoLmxlbmd0aCA+IDApXG4gICAgICAgIHJldHVybiAnLycgKyByZXNvbHZlZFBhdGg7XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiAnLyc7XG4gICAgfSBlbHNlIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHJlc29sdmVkUGF0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcuJztcbiAgICB9XG4gIH0sXG5cbiAgbm9ybWFsaXplOiBmdW5jdGlvbiBub3JtYWxpemUocGF0aCkge1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiAnLic7XG5cbiAgICB2YXIgaXNBYnNvbHV0ZSA9IHBhdGguY2hhckNvZGVBdCgwKSA9PT0gNDcgLyovKi87XG4gICAgdmFyIHRyYWlsaW5nU2VwYXJhdG9yID0gcGF0aC5jaGFyQ29kZUF0KHBhdGgubGVuZ3RoIC0gMSkgPT09IDQ3IC8qLyovO1xuXG4gICAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gICAgcGF0aCA9IG5vcm1hbGl6ZVN0cmluZ1Bvc2l4KHBhdGgsICFpc0Fic29sdXRlKTtcblxuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgcGF0aCA9ICcuJztcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwICYmIHRyYWlsaW5nU2VwYXJhdG9yKSBwYXRoICs9ICcvJztcblxuICAgIGlmIChpc0Fic29sdXRlKSByZXR1cm4gJy8nICsgcGF0aDtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBpc0Fic29sdXRlOiBmdW5jdGlvbiBpc0Fic29sdXRlKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHJldHVybiBwYXRoLmxlbmd0aCA+IDAgJiYgcGF0aC5jaGFyQ29kZUF0KDApID09PSA0NyAvKi8qLztcbiAgfSxcblxuICBqb2luOiBmdW5jdGlvbiBqb2luKCkge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgcmV0dXJuICcuJztcbiAgICB2YXIgam9pbmVkO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICB2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuICAgICAgYXNzZXJ0UGF0aChhcmcpO1xuICAgICAgaWYgKGFyZy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICBqb2luZWQgPSBhcmc7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBqb2luZWQgKz0gJy8nICsgYXJnO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoam9pbmVkID09PSB1bmRlZmluZWQpXG4gICAgICByZXR1cm4gJy4nO1xuICAgIHJldHVybiBwb3NpeC5ub3JtYWxpemUoam9pbmVkKTtcbiAgfSxcblxuICByZWxhdGl2ZTogZnVuY3Rpb24gcmVsYXRpdmUoZnJvbSwgdG8pIHtcbiAgICBhc3NlcnRQYXRoKGZyb20pO1xuICAgIGFzc2VydFBhdGgodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICBmcm9tID0gcG9zaXgucmVzb2x2ZShmcm9tKTtcbiAgICB0byA9IHBvc2l4LnJlc29sdmUodG8pO1xuXG4gICAgaWYgKGZyb20gPT09IHRvKSByZXR1cm4gJyc7XG5cbiAgICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gICAgdmFyIGZyb21TdGFydCA9IDE7XG4gICAgZm9yICg7IGZyb21TdGFydCA8IGZyb20ubGVuZ3RoOyArK2Zyb21TdGFydCkge1xuICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSA0NyAvKi8qLylcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciBmcm9tRW5kID0gZnJvbS5sZW5ndGg7XG4gICAgdmFyIGZyb21MZW4gPSBmcm9tRW5kIC0gZnJvbVN0YXJ0O1xuXG4gICAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICAgIHZhciB0b1N0YXJ0ID0gMTtcbiAgICBmb3IgKDsgdG9TdGFydCA8IHRvLmxlbmd0aDsgKyt0b1N0YXJ0KSB7XG4gICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gNDcgLyovKi8pXG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgdG9FbmQgPSB0by5sZW5ndGg7XG4gICAgdmFyIHRvTGVuID0gdG9FbmQgLSB0b1N0YXJ0O1xuXG4gICAgLy8gQ29tcGFyZSBwYXRocyB0byBmaW5kIHRoZSBsb25nZXN0IGNvbW1vbiBwYXRoIGZyb20gcm9vdFxuICAgIHZhciBsZW5ndGggPSBmcm9tTGVuIDwgdG9MZW4gPyBmcm9tTGVuIDogdG9MZW47XG4gICAgdmFyIGxhc3RDb21tb25TZXAgPSAtMTtcbiAgICB2YXIgaSA9IDA7XG4gICAgZm9yICg7IGkgPD0gbGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgICAgaWYgKHRvTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYGZyb21gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGB0b2AuXG4gICAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nL2Zvby9iYXInOyB0bz0nL2Zvby9iYXIvYmF6J1xuICAgICAgICAgICAgcmV0dXJuIHRvLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIHJvb3RcbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvJzsgdG89Jy9mb28nXG4gICAgICAgICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCArIGkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQgKyBpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYGZyb21gLlxuICAgICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209Jy9mb28vYmFyL2Jheic7IHRvPScvZm9vL2JhcidcbiAgICAgICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gV2UgZ2V0IGhlcmUgaWYgYHRvYCBpcyB0aGUgcm9vdC5cbiAgICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPScvZm9vJzsgdG89Jy8nXG4gICAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB2YXIgZnJvbUNvZGUgPSBmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSk7XG4gICAgICB2YXIgdG9Db2RlID0gdG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSk7XG4gICAgICBpZiAoZnJvbUNvZGUgIT09IHRvQ29kZSlcbiAgICAgICAgYnJlYWs7XG4gICAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gNDcgLyovKi8pXG4gICAgICAgIGxhc3RDb21tb25TZXAgPSBpO1xuICAgIH1cblxuICAgIHZhciBvdXQgPSAnJztcbiAgICAvLyBHZW5lcmF0ZSB0aGUgcmVsYXRpdmUgcGF0aCBiYXNlZCBvbiB0aGUgcGF0aCBkaWZmZXJlbmNlIGJldHdlZW4gYHRvYFxuICAgIC8vIGFuZCBgZnJvbWBcbiAgICBmb3IgKGkgPSBmcm9tU3RhcnQgKyBsYXN0Q29tbW9uU2VwICsgMTsgaSA8PSBmcm9tRW5kOyArK2kpIHtcbiAgICAgIGlmIChpID09PSBmcm9tRW5kIHx8IGZyb20uY2hhckNvZGVBdChpKSA9PT0gNDcgLyovKi8pIHtcbiAgICAgICAgaWYgKG91dC5sZW5ndGggPT09IDApXG4gICAgICAgICAgb3V0ICs9ICcuLic7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBvdXQgKz0gJy8uLic7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgICAvLyB0aGUgY29tbW9uIHBhdGggcGFydHNcbiAgICBpZiAob3V0Lmxlbmd0aCA+IDApXG4gICAgICByZXR1cm4gb3V0ICsgdG8uc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXApO1xuICAgIGVsc2Uge1xuICAgICAgdG9TdGFydCArPSBsYXN0Q29tbW9uU2VwO1xuICAgICAgaWYgKHRvLmNoYXJDb2RlQXQodG9TdGFydCkgPT09IDQ3IC8qLyovKVxuICAgICAgICArK3RvU3RhcnQ7XG4gICAgICByZXR1cm4gdG8uc2xpY2UodG9TdGFydCk7XG4gICAgfVxuICB9LFxuXG4gIF9tYWtlTG9uZzogZnVuY3Rpb24gX21ha2VMb25nKHBhdGgpIHtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICBkaXJuYW1lOiBmdW5jdGlvbiBkaXJuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIGlmIChwYXRoLmxlbmd0aCA9PT0gMCkgcmV0dXJuICcuJztcbiAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcbiAgICB2YXIgaGFzUm9vdCA9IGNvZGUgPT09IDQ3IC8qLyovO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICBmb3IgKHZhciBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDE7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvclxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZW5kID09PSAtMSkgcmV0dXJuIGhhc1Jvb3QgPyAnLycgOiAnLic7XG4gICAgaWYgKGhhc1Jvb3QgJiYgZW5kID09PSAxKSByZXR1cm4gJy8vJztcbiAgICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xuICB9LFxuXG4gIGJhc2VuYW1lOiBmdW5jdGlvbiBiYXNlbmFtZShwYXRoLCBleHQpIHtcbiAgICBpZiAoZXh0ICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIGV4dCAhPT0gJ3N0cmluZycpIHRocm93IG5ldyBUeXBlRXJyb3IoJ1wiZXh0XCIgYXJndW1lbnQgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICB2YXIgc3RhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaTtcblxuICAgIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiBleHQubGVuZ3RoID4gMCAmJiBleHQubGVuZ3RoIDw9IHBhdGgubGVuZ3RoKSB7XG4gICAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gJyc7XG4gICAgICB2YXIgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgICB2YXIgZmlyc3ROb25TbGFzaEVuZCA9IC0xO1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgICAgaWYgKGNvZGUgPT09IDQ3IC8qLyovKSB7XG4gICAgICAgICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICAgICAgICBzdGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChmaXJzdE5vblNsYXNoRW5kID09PSAtMSkge1xuICAgICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgICAgLy8gd2UgbmVlZCBpdCBpZiB0aGUgZXh0ZW5zaW9uIGVuZHMgdXAgbm90IG1hdGNoaW5nXG4gICAgICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGV4dElkeCA+PSAwKSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgICAgaWYgKGNvZGUgPT09IGV4dC5jaGFyQ29kZUF0KGV4dElkeCkpIHtcbiAgICAgICAgICAgICAgaWYgKC0tZXh0SWR4ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgICAvLyBjb21wb25lbnRcbiAgICAgICAgICAgICAgICBlbmQgPSBpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAvLyBFeHRlbnNpb24gZG9lcyBub3QgbWF0Y2gsIHNvIG91ciByZXN1bHQgaXMgdGhlIGVudGlyZSBwYXRoXG4gICAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgICBleHRJZHggPSAtMTtcbiAgICAgICAgICAgICAgZW5kID0gZmlyc3ROb25TbGFzaEVuZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXJ0ID09PSBlbmQpIGVuZCA9IGZpcnN0Tm9uU2xhc2hFbmQ7ZWxzZSBpZiAoZW5kID09PSAtMSkgZW5kID0gcGF0aC5sZW5ndGg7XG4gICAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IDA7IC0taSkge1xuICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KGkpID09PSA0NyAvKi8qLykge1xuICAgICAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgICAgIC8vIHNlcGFyYXRvcnMgYXQgdGhlIGVuZCBvZiB0aGUgc3RyaW5nLCBzdG9wIG5vd1xuICAgICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgICAgIC8vIHBhdGggY29tcG9uZW50XG4gICAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGVuZCA9PT0gLTEpIHJldHVybiAnJztcbiAgICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIH1cbiAgfSxcblxuICBleHRuYW1lOiBmdW5jdGlvbiBleHRuYW1lKHBhdGgpIHtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICAvLyBUcmFjayB0aGUgc3RhdGUgb2YgY2hhcmFjdGVycyAoaWYgYW55KSB3ZSBzZWUgYmVmb3JlIG91ciBmaXJzdCBkb3QgYW5kXG4gICAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgICB2YXIgcHJlRG90U3RhdGUgPSAwO1xuICAgIGZvciAodmFyIGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgICB2YXIgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKVxuICAgICAgICAgICAgc3RhcnREb3QgPSBpO1xuICAgICAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKVxuICAgICAgICAgICAgcHJlRG90U3RhdGUgPSAxO1xuICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICAgICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAgICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgICAgICBwcmVEb3RTdGF0ZSA9PT0gMSAmJiBzdGFydERvdCA9PT0gZW5kIC0gMSAmJiBzdGFydERvdCA9PT0gc3RhcnRQYXJ0ICsgMSkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfSxcblxuICBmb3JtYXQ6IGZ1bmN0aW9uIGZvcm1hdChwYXRoT2JqZWN0KSB7XG4gICAgaWYgKHBhdGhPYmplY3QgPT09IG51bGwgfHwgdHlwZW9mIHBhdGhPYmplY3QgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJwYXRoT2JqZWN0XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAnICsgdHlwZW9mIHBhdGhPYmplY3QpO1xuICAgIH1cbiAgICByZXR1cm4gX2Zvcm1hdCgnLycsIHBhdGhPYmplY3QpO1xuICB9LFxuXG4gIHBhcnNlOiBmdW5jdGlvbiBwYXJzZShwYXRoKSB7XG4gICAgYXNzZXJ0UGF0aChwYXRoKTtcblxuICAgIHZhciByZXQgPSB7IHJvb3Q6ICcnLCBkaXI6ICcnLCBiYXNlOiAnJywgZXh0OiAnJywgbmFtZTogJycgfTtcbiAgICBpZiAocGF0aC5sZW5ndGggPT09IDApIHJldHVybiByZXQ7XG4gICAgdmFyIGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgdmFyIGlzQWJzb2x1dGUgPSBjb2RlID09PSA0NyAvKi8qLztcbiAgICB2YXIgc3RhcnQ7XG4gICAgaWYgKGlzQWJzb2x1dGUpIHtcbiAgICAgIHJldC5yb290ID0gJy8nO1xuICAgICAgc3RhcnQgPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGFydCA9IDA7XG4gICAgfVxuICAgIHZhciBzdGFydERvdCA9IC0xO1xuICAgIHZhciBzdGFydFBhcnQgPSAwO1xuICAgIHZhciBlbmQgPSAtMTtcbiAgICB2YXIgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgICB2YXIgaSA9IHBhdGgubGVuZ3RoIC0gMTtcblxuICAgIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICAgIHZhciBwcmVEb3RTdGF0ZSA9IDA7XG5cbiAgICAvLyBHZXQgbm9uLWRpciBpbmZvXG4gICAgZm9yICg7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjb2RlID09PSA0NyAvKi8qLykge1xuICAgICAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgICAvLyBXZSBzYXcgdGhlIGZpcnN0IG5vbi1wYXRoIHNlcGFyYXRvciwgbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyXG4gICAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgICAgZW5kID0gaSArIDE7XG4gICAgICB9XG4gICAgICBpZiAoY29kZSA9PT0gNDYgLyouKi8pIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgICAgICBpZiAoc3RhcnREb3QgPT09IC0xKSBzdGFydERvdCA9IGk7ZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICAgICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgICAgLy8gaGF2ZSBhIGdvb2QgY2hhbmNlIGF0IGhhdmluZyBhIG5vbi1lbXB0eSBleHRlbnNpb25cbiAgICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3RhcnREb3QgPT09IC0xIHx8IGVuZCA9PT0gLTEgfHxcbiAgICAvLyBXZSBzYXcgYSBub24tZG90IGNoYXJhY3RlciBpbW1lZGlhdGVseSBiZWZvcmUgdGhlIGRvdFxuICAgIHByZURvdFN0YXRlID09PSAwIHx8XG4gICAgLy8gVGhlIChyaWdodC1tb3N0KSB0cmltbWVkIHBhdGggY29tcG9uZW50IGlzIGV4YWN0bHkgJy4uJ1xuICAgIHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKSB7XG4gICAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgICBpZiAoc3RhcnRQYXJ0ID09PSAwICYmIGlzQWJzb2x1dGUpIHJldC5iYXNlID0gcmV0Lm5hbWUgPSBwYXRoLnNsaWNlKDEsIGVuZCk7ZWxzZSByZXQuYmFzZSA9IHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIGVuZCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzdGFydFBhcnQgPT09IDAgJiYgaXNBYnNvbHV0ZSkge1xuICAgICAgICByZXQubmFtZSA9IHBhdGguc2xpY2UoMSwgc3RhcnREb3QpO1xuICAgICAgICByZXQuYmFzZSA9IHBhdGguc2xpY2UoMSwgZW5kKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldC5uYW1lID0gcGF0aC5zbGljZShzdGFydFBhcnQsIHN0YXJ0RG90KTtcbiAgICAgICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICAgIH1cbiAgICAgIHJldC5leHQgPSBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xuICAgIH1cblxuICAgIGlmIChzdGFydFBhcnQgPiAwKSByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtlbHNlIGlmIChpc0Fic29sdXRlKSByZXQuZGlyID0gJy8nO1xuXG4gICAgcmV0dXJuIHJldDtcbiAgfSxcblxuICBzZXA6ICcvJyxcbiAgZGVsaW1pdGVyOiAnOicsXG4gIHdpbjMyOiBudWxsLFxuICBwb3NpeDogbnVsbFxufTtcblxucG9zaXgucG9zaXggPSBwb3NpeDtcblxubW9kdWxlLmV4cG9ydHMgPSBwb3NpeDtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59IiwiLy8gQ3VycmVudGx5IGluIHN5bmMgd2l0aCBOb2RlLmpzIGxpYi9pbnRlcm5hbC91dGlsL3R5cGVzLmpzXG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWpzL25vZGUvY29tbWl0LzExMmNjN2MyNzU1MTI1NGFhMmIxNzA5OGZiNzc0ODY3ZjA1ZWQwZDlcblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNBcmd1bWVudHNPYmplY3QgPSByZXF1aXJlKCdpcy1hcmd1bWVudHMnKTtcbnZhciBpc0dlbmVyYXRvckZ1bmN0aW9uID0gcmVxdWlyZSgnaXMtZ2VuZXJhdG9yLWZ1bmN0aW9uJyk7XG52YXIgd2hpY2hUeXBlZEFycmF5ID0gcmVxdWlyZSgnd2hpY2gtdHlwZWQtYXJyYXknKTtcbnZhciBpc1R5cGVkQXJyYXkgPSByZXF1aXJlKCdpcy10eXBlZC1hcnJheScpO1xuXG5mdW5jdGlvbiB1bmN1cnJ5VGhpcyhmKSB7XG4gIHJldHVybiBmLmNhbGwuYmluZChmKTtcbn1cblxudmFyIEJpZ0ludFN1cHBvcnRlZCA9IHR5cGVvZiBCaWdJbnQgIT09ICd1bmRlZmluZWQnO1xudmFyIFN5bWJvbFN1cHBvcnRlZCA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnO1xuXG52YXIgT2JqZWN0VG9TdHJpbmcgPSB1bmN1cnJ5VGhpcyhPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nKTtcblxudmFyIG51bWJlclZhbHVlID0gdW5jdXJyeVRoaXMoTnVtYmVyLnByb3RvdHlwZS52YWx1ZU9mKTtcbnZhciBzdHJpbmdWYWx1ZSA9IHVuY3VycnlUaGlzKFN0cmluZy5wcm90b3R5cGUudmFsdWVPZik7XG52YXIgYm9vbGVhblZhbHVlID0gdW5jdXJyeVRoaXMoQm9vbGVhbi5wcm90b3R5cGUudmFsdWVPZik7XG5cbmlmIChCaWdJbnRTdXBwb3J0ZWQpIHtcbiAgdmFyIGJpZ0ludFZhbHVlID0gdW5jdXJyeVRoaXMoQmlnSW50LnByb3RvdHlwZS52YWx1ZU9mKTtcbn1cblxuaWYgKFN5bWJvbFN1cHBvcnRlZCkge1xuICB2YXIgc3ltYm9sVmFsdWUgPSB1bmN1cnJ5VGhpcyhTeW1ib2wucHJvdG90eXBlLnZhbHVlT2YpO1xufVxuXG5mdW5jdGlvbiBjaGVja0JveGVkUHJpbWl0aXZlKHZhbHVlLCBwcm90b3R5cGVWYWx1ZU9mKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHRyeSB7XG4gICAgcHJvdG90eXBlVmFsdWVPZih2YWx1ZSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2goZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnRzLmlzQXJndW1lbnRzT2JqZWN0ID0gaXNBcmd1bWVudHNPYmplY3Q7XG5leHBvcnRzLmlzR2VuZXJhdG9yRnVuY3Rpb24gPSBpc0dlbmVyYXRvckZ1bmN0aW9uO1xuZXhwb3J0cy5pc1R5cGVkQXJyYXkgPSBpc1R5cGVkQXJyYXk7XG5cbi8vIFRha2VuIGZyb20gaGVyZSBhbmQgbW9kaWZpZWQgZm9yIGJldHRlciBicm93c2VyIHN1cHBvcnRcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcC1pcy1wcm9taXNlL2Jsb2IvY2RhMzVhNTEzYmRhMDNmOTc3YWQ1Y2RlM2EwNzlkMjM3ZTgyZDdlZi9pbmRleC5qc1xuZnVuY3Rpb24gaXNQcm9taXNlKGlucHV0KSB7XG5cdHJldHVybiAoXG5cdFx0KFxuXHRcdFx0dHlwZW9mIFByb21pc2UgIT09ICd1bmRlZmluZWQnICYmXG5cdFx0XHRpbnB1dCBpbnN0YW5jZW9mIFByb21pc2Vcblx0XHQpIHx8XG5cdFx0KFxuXHRcdFx0aW5wdXQgIT09IG51bGwgJiZcblx0XHRcdHR5cGVvZiBpbnB1dCA9PT0gJ29iamVjdCcgJiZcblx0XHRcdHR5cGVvZiBpbnB1dC50aGVuID09PSAnZnVuY3Rpb24nICYmXG5cdFx0XHR0eXBlb2YgaW5wdXQuY2F0Y2ggPT09ICdmdW5jdGlvbidcblx0XHQpXG5cdCk7XG59XG5leHBvcnRzLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcblxuZnVuY3Rpb24gaXNBcnJheUJ1ZmZlclZpZXcodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgJiYgQXJyYXlCdWZmZXIuaXNWaWV3KSB7XG4gICAgcmV0dXJuIEFycmF5QnVmZmVyLmlzVmlldyh2YWx1ZSk7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIGlzVHlwZWRBcnJheSh2YWx1ZSkgfHxcbiAgICBpc0RhdGFWaWV3KHZhbHVlKVxuICApO1xufVxuZXhwb3J0cy5pc0FycmF5QnVmZmVyVmlldyA9IGlzQXJyYXlCdWZmZXJWaWV3O1xuXG5cbmZ1bmN0aW9uIGlzVWludDhBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gd2hpY2hUeXBlZEFycmF5KHZhbHVlKSA9PT0gJ1VpbnQ4QXJyYXknO1xufVxuZXhwb3J0cy5pc1VpbnQ4QXJyYXkgPSBpc1VpbnQ4QXJyYXk7XG5cbmZ1bmN0aW9uIGlzVWludDhDbGFtcGVkQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHdoaWNoVHlwZWRBcnJheSh2YWx1ZSkgPT09ICdVaW50OENsYW1wZWRBcnJheSc7XG59XG5leHBvcnRzLmlzVWludDhDbGFtcGVkQXJyYXkgPSBpc1VpbnQ4Q2xhbXBlZEFycmF5O1xuXG5mdW5jdGlvbiBpc1VpbnQxNkFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB3aGljaFR5cGVkQXJyYXkodmFsdWUpID09PSAnVWludDE2QXJyYXknO1xufVxuZXhwb3J0cy5pc1VpbnQxNkFycmF5ID0gaXNVaW50MTZBcnJheTtcblxuZnVuY3Rpb24gaXNVaW50MzJBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gd2hpY2hUeXBlZEFycmF5KHZhbHVlKSA9PT0gJ1VpbnQzMkFycmF5Jztcbn1cbmV4cG9ydHMuaXNVaW50MzJBcnJheSA9IGlzVWludDMyQXJyYXk7XG5cbmZ1bmN0aW9uIGlzSW50OEFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB3aGljaFR5cGVkQXJyYXkodmFsdWUpID09PSAnSW50OEFycmF5Jztcbn1cbmV4cG9ydHMuaXNJbnQ4QXJyYXkgPSBpc0ludDhBcnJheTtcblxuZnVuY3Rpb24gaXNJbnQxNkFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB3aGljaFR5cGVkQXJyYXkodmFsdWUpID09PSAnSW50MTZBcnJheSc7XG59XG5leHBvcnRzLmlzSW50MTZBcnJheSA9IGlzSW50MTZBcnJheTtcblxuZnVuY3Rpb24gaXNJbnQzMkFycmF5KHZhbHVlKSB7XG4gIHJldHVybiB3aGljaFR5cGVkQXJyYXkodmFsdWUpID09PSAnSW50MzJBcnJheSc7XG59XG5leHBvcnRzLmlzSW50MzJBcnJheSA9IGlzSW50MzJBcnJheTtcblxuZnVuY3Rpb24gaXNGbG9hdDMyQXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHdoaWNoVHlwZWRBcnJheSh2YWx1ZSkgPT09ICdGbG9hdDMyQXJyYXknO1xufVxuZXhwb3J0cy5pc0Zsb2F0MzJBcnJheSA9IGlzRmxvYXQzMkFycmF5O1xuXG5mdW5jdGlvbiBpc0Zsb2F0NjRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gd2hpY2hUeXBlZEFycmF5KHZhbHVlKSA9PT0gJ0Zsb2F0NjRBcnJheSc7XG59XG5leHBvcnRzLmlzRmxvYXQ2NEFycmF5ID0gaXNGbG9hdDY0QXJyYXk7XG5cbmZ1bmN0aW9uIGlzQmlnSW50NjRBcnJheSh2YWx1ZSkge1xuICByZXR1cm4gd2hpY2hUeXBlZEFycmF5KHZhbHVlKSA9PT0gJ0JpZ0ludDY0QXJyYXknO1xufVxuZXhwb3J0cy5pc0JpZ0ludDY0QXJyYXkgPSBpc0JpZ0ludDY0QXJyYXk7XG5cbmZ1bmN0aW9uIGlzQmlnVWludDY0QXJyYXkodmFsdWUpIHtcbiAgcmV0dXJuIHdoaWNoVHlwZWRBcnJheSh2YWx1ZSkgPT09ICdCaWdVaW50NjRBcnJheSc7XG59XG5leHBvcnRzLmlzQmlnVWludDY0QXJyYXkgPSBpc0JpZ1VpbnQ2NEFycmF5O1xuXG5mdW5jdGlvbiBpc01hcFRvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3RUb1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IE1hcF0nO1xufVxuaXNNYXBUb1N0cmluZy53b3JraW5nID0gKFxuICB0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJyAmJlxuICBpc01hcFRvU3RyaW5nKG5ldyBNYXAoKSlcbik7XG5cbmZ1bmN0aW9uIGlzTWFwKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgTWFwID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBpc01hcFRvU3RyaW5nLndvcmtpbmdcbiAgICA/IGlzTWFwVG9TdHJpbmcodmFsdWUpXG4gICAgOiB2YWx1ZSBpbnN0YW5jZW9mIE1hcDtcbn1cbmV4cG9ydHMuaXNNYXAgPSBpc01hcDtcblxuZnVuY3Rpb24gaXNTZXRUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0VG9TdHJpbmcodmFsdWUpID09PSAnW29iamVjdCBTZXRdJztcbn1cbmlzU2V0VG9TdHJpbmcud29ya2luZyA9IChcbiAgdHlwZW9mIFNldCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgaXNTZXRUb1N0cmluZyhuZXcgU2V0KCkpXG4pO1xuZnVuY3Rpb24gaXNTZXQodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBTZXQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzU2V0VG9TdHJpbmcud29ya2luZ1xuICAgID8gaXNTZXRUb1N0cmluZyh2YWx1ZSlcbiAgICA6IHZhbHVlIGluc3RhbmNlb2YgU2V0O1xufVxuZXhwb3J0cy5pc1NldCA9IGlzU2V0O1xuXG5mdW5jdGlvbiBpc1dlYWtNYXBUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0VG9TdHJpbmcodmFsdWUpID09PSAnW29iamVjdCBXZWFrTWFwXSc7XG59XG5pc1dlYWtNYXBUb1N0cmluZy53b3JraW5nID0gKFxuICB0eXBlb2YgV2Vha01hcCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgaXNXZWFrTWFwVG9TdHJpbmcobmV3IFdlYWtNYXAoKSlcbik7XG5mdW5jdGlvbiBpc1dlYWtNYXAodmFsdWUpIHtcbiAgaWYgKHR5cGVvZiBXZWFrTWFwID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBpc1dlYWtNYXBUb1N0cmluZy53b3JraW5nXG4gICAgPyBpc1dlYWtNYXBUb1N0cmluZyh2YWx1ZSlcbiAgICA6IHZhbHVlIGluc3RhbmNlb2YgV2Vha01hcDtcbn1cbmV4cG9ydHMuaXNXZWFrTWFwID0gaXNXZWFrTWFwO1xuXG5mdW5jdGlvbiBpc1dlYWtTZXRUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0VG9TdHJpbmcodmFsdWUpID09PSAnW29iamVjdCBXZWFrU2V0XSc7XG59XG5pc1dlYWtTZXRUb1N0cmluZy53b3JraW5nID0gKFxuICB0eXBlb2YgV2Vha1NldCAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgaXNXZWFrU2V0VG9TdHJpbmcobmV3IFdlYWtTZXQoKSlcbik7XG5mdW5jdGlvbiBpc1dlYWtTZXQodmFsdWUpIHtcbiAgcmV0dXJuIGlzV2Vha1NldFRvU3RyaW5nKHZhbHVlKTtcbn1cbmV4cG9ydHMuaXNXZWFrU2V0ID0gaXNXZWFrU2V0O1xuXG5mdW5jdGlvbiBpc0FycmF5QnVmZmVyVG9TdHJpbmcodmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdFRvU3RyaW5nKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXlCdWZmZXJdJztcbn1cbmlzQXJyYXlCdWZmZXJUb1N0cmluZy53b3JraW5nID0gKFxuICB0eXBlb2YgQXJyYXlCdWZmZXIgIT09ICd1bmRlZmluZWQnICYmXG4gIGlzQXJyYXlCdWZmZXJUb1N0cmluZyhuZXcgQXJyYXlCdWZmZXIoKSlcbik7XG5mdW5jdGlvbiBpc0FycmF5QnVmZmVyKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzQXJyYXlCdWZmZXJUb1N0cmluZy53b3JraW5nXG4gICAgPyBpc0FycmF5QnVmZmVyVG9TdHJpbmcodmFsdWUpXG4gICAgOiB2YWx1ZSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyO1xufVxuZXhwb3J0cy5pc0FycmF5QnVmZmVyID0gaXNBcnJheUJ1ZmZlcjtcblxuZnVuY3Rpb24gaXNEYXRhVmlld1RvU3RyaW5nKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3RUb1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IERhdGFWaWV3XSc7XG59XG5pc0RhdGFWaWV3VG9TdHJpbmcud29ya2luZyA9IChcbiAgdHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJyAmJlxuICB0eXBlb2YgRGF0YVZpZXcgIT09ICd1bmRlZmluZWQnICYmXG4gIGlzRGF0YVZpZXdUb1N0cmluZyhuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKDEpLCAwLCAxKSlcbik7XG5mdW5jdGlvbiBpc0RhdGFWaWV3KHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgRGF0YVZpZXcgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGlzRGF0YVZpZXdUb1N0cmluZy53b3JraW5nXG4gICAgPyBpc0RhdGFWaWV3VG9TdHJpbmcodmFsdWUpXG4gICAgOiB2YWx1ZSBpbnN0YW5jZW9mIERhdGFWaWV3O1xufVxuZXhwb3J0cy5pc0RhdGFWaWV3ID0gaXNEYXRhVmlldztcblxuLy8gU3RvcmUgYSBjb3B5IG9mIFNoYXJlZEFycmF5QnVmZmVyIGluIGNhc2UgaXQncyBkZWxldGVkIGVsc2V3aGVyZVxudmFyIFNoYXJlZEFycmF5QnVmZmVyQ29weSA9IHR5cGVvZiBTaGFyZWRBcnJheUJ1ZmZlciAhPT0gJ3VuZGVmaW5lZCcgPyBTaGFyZWRBcnJheUJ1ZmZlciA6IHVuZGVmaW5lZDtcbmZ1bmN0aW9uIGlzU2hhcmVkQXJyYXlCdWZmZXJUb1N0cmluZyh2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0VG9TdHJpbmcodmFsdWUpID09PSAnW29iamVjdCBTaGFyZWRBcnJheUJ1ZmZlcl0nO1xufVxuZnVuY3Rpb24gaXNTaGFyZWRBcnJheUJ1ZmZlcih2YWx1ZSkge1xuICBpZiAodHlwZW9mIFNoYXJlZEFycmF5QnVmZmVyQ29weSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAodHlwZW9mIGlzU2hhcmVkQXJyYXlCdWZmZXJUb1N0cmluZy53b3JraW5nID09PSAndW5kZWZpbmVkJykge1xuICAgIGlzU2hhcmVkQXJyYXlCdWZmZXJUb1N0cmluZy53b3JraW5nID0gaXNTaGFyZWRBcnJheUJ1ZmZlclRvU3RyaW5nKG5ldyBTaGFyZWRBcnJheUJ1ZmZlckNvcHkoKSk7XG4gIH1cblxuICByZXR1cm4gaXNTaGFyZWRBcnJheUJ1ZmZlclRvU3RyaW5nLndvcmtpbmdcbiAgICA/IGlzU2hhcmVkQXJyYXlCdWZmZXJUb1N0cmluZyh2YWx1ZSlcbiAgICA6IHZhbHVlIGluc3RhbmNlb2YgU2hhcmVkQXJyYXlCdWZmZXJDb3B5O1xufVxuZXhwb3J0cy5pc1NoYXJlZEFycmF5QnVmZmVyID0gaXNTaGFyZWRBcnJheUJ1ZmZlcjtcblxuZnVuY3Rpb24gaXNBc3luY0Z1bmN0aW9uKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3RUb1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IEFzeW5jRnVuY3Rpb25dJztcbn1cbmV4cG9ydHMuaXNBc3luY0Z1bmN0aW9uID0gaXNBc3luY0Z1bmN0aW9uO1xuXG5mdW5jdGlvbiBpc01hcEl0ZXJhdG9yKHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3RUb1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IE1hcCBJdGVyYXRvcl0nO1xufVxuZXhwb3J0cy5pc01hcEl0ZXJhdG9yID0gaXNNYXBJdGVyYXRvcjtcblxuZnVuY3Rpb24gaXNTZXRJdGVyYXRvcih2YWx1ZSkge1xuICByZXR1cm4gT2JqZWN0VG9TdHJpbmcodmFsdWUpID09PSAnW29iamVjdCBTZXQgSXRlcmF0b3JdJztcbn1cbmV4cG9ydHMuaXNTZXRJdGVyYXRvciA9IGlzU2V0SXRlcmF0b3I7XG5cbmZ1bmN0aW9uIGlzR2VuZXJhdG9yT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBPYmplY3RUb1N0cmluZyh2YWx1ZSkgPT09ICdbb2JqZWN0IEdlbmVyYXRvcl0nO1xufVxuZXhwb3J0cy5pc0dlbmVyYXRvck9iamVjdCA9IGlzR2VuZXJhdG9yT2JqZWN0O1xuXG5mdW5jdGlvbiBpc1dlYkFzc2VtYmx5Q29tcGlsZWRNb2R1bGUodmFsdWUpIHtcbiAgcmV0dXJuIE9iamVjdFRvU3RyaW5nKHZhbHVlKSA9PT0gJ1tvYmplY3QgV2ViQXNzZW1ibHkuTW9kdWxlXSc7XG59XG5leHBvcnRzLmlzV2ViQXNzZW1ibHlDb21waWxlZE1vZHVsZSA9IGlzV2ViQXNzZW1ibHlDb21waWxlZE1vZHVsZTtcblxuZnVuY3Rpb24gaXNOdW1iZXJPYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGNoZWNrQm94ZWRQcmltaXRpdmUodmFsdWUsIG51bWJlclZhbHVlKTtcbn1cbmV4cG9ydHMuaXNOdW1iZXJPYmplY3QgPSBpc051bWJlck9iamVjdDtcblxuZnVuY3Rpb24gaXNTdHJpbmdPYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIGNoZWNrQm94ZWRQcmltaXRpdmUodmFsdWUsIHN0cmluZ1ZhbHVlKTtcbn1cbmV4cG9ydHMuaXNTdHJpbmdPYmplY3QgPSBpc1N0cmluZ09iamVjdDtcblxuZnVuY3Rpb24gaXNCb29sZWFuT2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBjaGVja0JveGVkUHJpbWl0aXZlKHZhbHVlLCBib29sZWFuVmFsdWUpO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW5PYmplY3QgPSBpc0Jvb2xlYW5PYmplY3Q7XG5cbmZ1bmN0aW9uIGlzQmlnSW50T2JqZWN0KHZhbHVlKSB7XG4gIHJldHVybiBCaWdJbnRTdXBwb3J0ZWQgJiYgY2hlY2tCb3hlZFByaW1pdGl2ZSh2YWx1ZSwgYmlnSW50VmFsdWUpO1xufVxuZXhwb3J0cy5pc0JpZ0ludE9iamVjdCA9IGlzQmlnSW50T2JqZWN0O1xuXG5mdW5jdGlvbiBpc1N5bWJvbE9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gU3ltYm9sU3VwcG9ydGVkICYmIGNoZWNrQm94ZWRQcmltaXRpdmUodmFsdWUsIHN5bWJvbFZhbHVlKTtcbn1cbmV4cG9ydHMuaXNTeW1ib2xPYmplY3QgPSBpc1N5bWJvbE9iamVjdDtcblxuZnVuY3Rpb24gaXNCb3hlZFByaW1pdGl2ZSh2YWx1ZSkge1xuICByZXR1cm4gKFxuICAgIGlzTnVtYmVyT2JqZWN0KHZhbHVlKSB8fFxuICAgIGlzU3RyaW5nT2JqZWN0KHZhbHVlKSB8fFxuICAgIGlzQm9vbGVhbk9iamVjdCh2YWx1ZSkgfHxcbiAgICBpc0JpZ0ludE9iamVjdCh2YWx1ZSkgfHxcbiAgICBpc1N5bWJvbE9iamVjdCh2YWx1ZSlcbiAgKTtcbn1cbmV4cG9ydHMuaXNCb3hlZFByaW1pdGl2ZSA9IGlzQm94ZWRQcmltaXRpdmU7XG5cbmZ1bmN0aW9uIGlzQW55QXJyYXlCdWZmZXIodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiBVaW50OEFycmF5ICE9PSAndW5kZWZpbmVkJyAmJiAoXG4gICAgaXNBcnJheUJ1ZmZlcih2YWx1ZSkgfHxcbiAgICBpc1NoYXJlZEFycmF5QnVmZmVyKHZhbHVlKVxuICApO1xufVxuZXhwb3J0cy5pc0FueUFycmF5QnVmZmVyID0gaXNBbnlBcnJheUJ1ZmZlcjtcblxuWydpc1Byb3h5JywgJ2lzRXh0ZXJuYWwnLCAnaXNNb2R1bGVOYW1lc3BhY2VPYmplY3QnXS5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbWV0aG9kLCB7XG4gICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1ldGhvZCArICcgaXMgbm90IHN1cHBvcnRlZCBpbiB1c2VybGFuZCcpO1xuICAgIH1cbiAgfSk7XG59KTtcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG52YXIgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzIHx8XG4gIGZ1bmN0aW9uIGdldE93blByb3BlcnR5RGVzY3JpcHRvcnMob2JqKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhvYmopO1xuICAgIHZhciBkZXNjcmlwdG9ycyA9IHt9O1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgZGVzY3JpcHRvcnNba2V5c1tpXV0gPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKG9iaiwga2V5c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBkZXNjcmlwdG9ycztcbiAgfTtcblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcHJvY2Vzcy5ub0RlcHJlY2F0aW9uID09PSB0cnVlKSB7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgLy8gQWxsb3cgZm9yIGRlcHJlY2F0aW5nIHRoaW5ncyBpbiB0aGUgcHJvY2VzcyBvZiBzdGFydGluZyB1cC5cbiAgaWYgKHR5cGVvZiBwcm9jZXNzID09PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBleHBvcnRzLmRlcHJlY2F0ZShmbiwgbXNnKS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZSZWdleCA9IC9eJC87XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0RFQlVHKSB7XG4gIHZhciBkZWJ1Z0VudiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUc7XG4gIGRlYnVnRW52ID0gZGVidWdFbnYucmVwbGFjZSgvW3xcXFxce30oKVtcXF1eJCs/Ll0vZywgJ1xcXFwkJicpXG4gICAgLnJlcGxhY2UoL1xcKi9nLCAnLionKVxuICAgIC5yZXBsYWNlKC8sL2csICckfF4nKVxuICAgIC50b1VwcGVyQ2FzZSgpO1xuICBkZWJ1Z0VudlJlZ2V4ID0gbmV3IFJlZ0V4cCgnXicgKyBkZWJ1Z0VudiArICckJywgJ2knKTtcbn1cbmV4cG9ydHMuZGVidWdsb2cgPSBmdW5jdGlvbihzZXQpIHtcbiAgc2V0ID0gc2V0LnRvVXBwZXJDYXNlKCk7XG4gIGlmICghZGVidWdzW3NldF0pIHtcbiAgICBpZiAoZGVidWdFbnZSZWdleC50ZXN0KHNldCkpIHtcbiAgICAgIHZhciBwaWQgPSBwcm9jZXNzLnBpZDtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBtc2cgPSBleHBvcnRzLmZvcm1hdC5hcHBseShleHBvcnRzLCBhcmd1bWVudHMpO1xuICAgICAgICBjb25zb2xlLmVycm9yKCclcyAlZDogJXMnLCBzZXQsIHBpZCwgbXNnKTtcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlYnVnc1tzZXRdID0gZnVuY3Rpb24oKSB7fTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGRlYnVnc1tzZXRdO1xufTtcblxuXG4vKipcbiAqIEVjaG9zIHRoZSB2YWx1ZSBvZiBhIHZhbHVlLiBUcnlzIHRvIHByaW50IHRoZSB2YWx1ZSBvdXRcbiAqIGluIHRoZSBiZXN0IHdheSBwb3NzaWJsZSBnaXZlbiB0aGUgZGlmZmVyZW50IHR5cGVzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmogVGhlIG9iamVjdCB0byBwcmludCBvdXQuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBPcHRpb25hbCBvcHRpb25zIG9iamVjdCB0aGF0IGFsdGVycyB0aGUgb3V0cHV0LlxuICovXG4vKiBsZWdhY3k6IG9iaiwgc2hvd0hpZGRlbiwgZGVwdGgsIGNvbG9ycyovXG5mdW5jdGlvbiBpbnNwZWN0KG9iaiwgb3B0cykge1xuICAvLyBkZWZhdWx0IG9wdGlvbnNcbiAgdmFyIGN0eCA9IHtcbiAgICBzZWVuOiBbXSxcbiAgICBzdHlsaXplOiBzdHlsaXplTm9Db2xvclxuICB9O1xuICAvLyBsZWdhY3kuLi5cbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gMykgY3R4LmRlcHRoID0gYXJndW1lbnRzWzJdO1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSA0KSBjdHguY29sb3JzID0gYXJndW1lbnRzWzNdO1xuICBpZiAoaXNCb29sZWFuKG9wdHMpKSB7XG4gICAgLy8gbGVnYWN5Li4uXG4gICAgY3R4LnNob3dIaWRkZW4gPSBvcHRzO1xuICB9IGVsc2UgaWYgKG9wdHMpIHtcbiAgICAvLyBnb3QgYW4gXCJvcHRpb25zXCIgb2JqZWN0XG4gICAgZXhwb3J0cy5fZXh0ZW5kKGN0eCwgb3B0cyk7XG4gIH1cbiAgLy8gc2V0IGRlZmF1bHQgb3B0aW9uc1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LnNob3dIaWRkZW4pKSBjdHguc2hvd0hpZGRlbiA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmRlcHRoKSkgY3R4LmRlcHRoID0gMjtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jb2xvcnMpKSBjdHguY29sb3JzID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY3VzdG9tSW5zcGVjdCkpIGN0eC5jdXN0b21JbnNwZWN0ID0gdHJ1ZTtcbiAgaWYgKGN0eC5jb2xvcnMpIGN0eC5zdHlsaXplID0gc3R5bGl6ZVdpdGhDb2xvcjtcbiAgcmV0dXJuIGZvcm1hdFZhbHVlKGN0eCwgb2JqLCBjdHguZGVwdGgpO1xufVxuZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblxuXG4vLyBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGUjZ3JhcGhpY3Ncbmluc3BlY3QuY29sb3JzID0ge1xuICAnYm9sZCcgOiBbMSwgMjJdLFxuICAnaXRhbGljJyA6IFszLCAyM10sXG4gICd1bmRlcmxpbmUnIDogWzQsIDI0XSxcbiAgJ2ludmVyc2UnIDogWzcsIDI3XSxcbiAgJ3doaXRlJyA6IFszNywgMzldLFxuICAnZ3JleScgOiBbOTAsIDM5XSxcbiAgJ2JsYWNrJyA6IFszMCwgMzldLFxuICAnYmx1ZScgOiBbMzQsIDM5XSxcbiAgJ2N5YW4nIDogWzM2LCAzOV0sXG4gICdncmVlbicgOiBbMzIsIDM5XSxcbiAgJ21hZ2VudGEnIDogWzM1LCAzOV0sXG4gICdyZWQnIDogWzMxLCAzOV0sXG4gICd5ZWxsb3cnIDogWzMzLCAzOV1cbn07XG5cbi8vIERvbid0IHVzZSAnYmx1ZScgbm90IHZpc2libGUgb24gY21kLmV4ZVxuaW5zcGVjdC5zdHlsZXMgPSB7XG4gICdzcGVjaWFsJzogJ2N5YW4nLFxuICAnbnVtYmVyJzogJ3llbGxvdycsXG4gICdib29sZWFuJzogJ3llbGxvdycsXG4gICd1bmRlZmluZWQnOiAnZ3JleScsXG4gICdudWxsJzogJ2JvbGQnLFxuICAnc3RyaW5nJzogJ2dyZWVuJyxcbiAgJ2RhdGUnOiAnbWFnZW50YScsXG4gIC8vIFwibmFtZVwiOiBpbnRlbnRpb25hbGx5IG5vdCBzdHlsaW5nXG4gICdyZWdleHAnOiAncmVkJ1xufTtcblxuXG5mdW5jdGlvbiBzdHlsaXplV2l0aENvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHZhciBzdHlsZSA9IGluc3BlY3Quc3R5bGVzW3N0eWxlVHlwZV07XG5cbiAgaWYgKHN0eWxlKSB7XG4gICAgcmV0dXJuICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMF0gKyAnbScgKyBzdHIgK1xuICAgICAgICAgICAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzFdICsgJ20nO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHI7XG4gIH1cbn1cblxuXG5mdW5jdGlvbiBzdHlsaXplTm9Db2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICByZXR1cm4gc3RyO1xufVxuXG5cbmZ1bmN0aW9uIGFycmF5VG9IYXNoKGFycmF5KSB7XG4gIHZhciBoYXNoID0ge307XG5cbiAgYXJyYXkuZm9yRWFjaChmdW5jdGlvbih2YWwsIGlkeCkge1xuICAgIGhhc2hbdmFsXSA9IHRydWU7XG4gIH0pO1xuXG4gIHJldHVybiBoYXNoO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFZhbHVlKGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcykge1xuICAvLyBQcm92aWRlIGEgaG9vayBmb3IgdXNlci1zcGVjaWZpZWQgaW5zcGVjdCBmdW5jdGlvbnMuXG4gIC8vIENoZWNrIHRoYXQgdmFsdWUgaXMgYW4gb2JqZWN0IHdpdGggYW4gaW5zcGVjdCBmdW5jdGlvbiBvbiBpdFxuICBpZiAoY3R4LmN1c3RvbUluc3BlY3QgJiZcbiAgICAgIHZhbHVlICYmXG4gICAgICBpc0Z1bmN0aW9uKHZhbHVlLmluc3BlY3QpICYmXG4gICAgICAvLyBGaWx0ZXIgb3V0IHRoZSB1dGlsIG1vZHVsZSwgaXQncyBpbnNwZWN0IGZ1bmN0aW9uIGlzIHNwZWNpYWxcbiAgICAgIHZhbHVlLmluc3BlY3QgIT09IGV4cG9ydHMuaW5zcGVjdCAmJlxuICAgICAgLy8gQWxzbyBmaWx0ZXIgb3V0IGFueSBwcm90b3R5cGUgb2JqZWN0cyB1c2luZyB0aGUgY2lyY3VsYXIgY2hlY2suXG4gICAgICAhKHZhbHVlLmNvbnN0cnVjdG9yICYmIHZhbHVlLmNvbnN0cnVjdG9yLnByb3RvdHlwZSA9PT0gdmFsdWUpKSB7XG4gICAgdmFyIHJldCA9IHZhbHVlLmluc3BlY3QocmVjdXJzZVRpbWVzLCBjdHgpO1xuICAgIGlmICghaXNTdHJpbmcocmV0KSkge1xuICAgICAgcmV0ID0gZm9ybWF0VmFsdWUoY3R4LCByZXQsIHJlY3Vyc2VUaW1lcyk7XG4gICAgfVxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICAvLyBQcmltaXRpdmUgdHlwZXMgY2Fubm90IGhhdmUgcHJvcGVydGllc1xuICB2YXIgcHJpbWl0aXZlID0gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpO1xuICBpZiAocHJpbWl0aXZlKSB7XG4gICAgcmV0dXJuIHByaW1pdGl2ZTtcbiAgfVxuXG4gIC8vIExvb2sgdXAgdGhlIGtleXMgb2YgdGhlIG9iamVjdC5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7XG4gIHZhciB2aXNpYmxlS2V5cyA9IGFycmF5VG9IYXNoKGtleXMpO1xuXG4gIGlmIChjdHguc2hvd0hpZGRlbikge1xuICAgIGtleXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh2YWx1ZSk7XG4gIH1cblxuICAvLyBJRSBkb2Vzbid0IG1ha2UgZXJyb3IgZmllbGRzIG5vbi1lbnVtZXJhYmxlXG4gIC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS9pZS9kd3c1MnNidCh2PXZzLjk0KS5hc3B4XG4gIGlmIChpc0Vycm9yKHZhbHVlKVxuICAgICAgJiYgKGtleXMuaW5kZXhPZignbWVzc2FnZScpID49IDAgfHwga2V5cy5pbmRleE9mKCdkZXNjcmlwdGlvbicpID49IDApKSB7XG4gICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIC8vIFNvbWUgdHlwZSBvZiBvYmplY3Qgd2l0aG91dCBwcm9wZXJ0aWVzIGNhbiBiZSBzaG9ydGN1dHRlZC5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICB2YXIgbmFtZSA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbRnVuY3Rpb24nICsgbmFtZSArICddJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9XG4gICAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShEYXRlLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ2RhdGUnKTtcbiAgICB9XG4gICAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBiYXNlID0gJycsIGFycmF5ID0gZmFsc2UsIGJyYWNlcyA9IFsneycsICd9J107XG5cbiAgLy8gTWFrZSBBcnJheSBzYXkgdGhhdCB0aGV5IGFyZSBBcnJheVxuICBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcbiAgICBhcnJheSA9IHRydWU7XG4gICAgYnJhY2VzID0gWydbJywgJ10nXTtcbiAgfVxuXG4gIC8vIE1ha2UgZnVuY3Rpb25zIHNheSB0aGF0IHRoZXkgYXJlIGZ1bmN0aW9uc1xuICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICB2YXIgbiA9IHZhbHVlLm5hbWUgPyAnOiAnICsgdmFsdWUubmFtZSA6ICcnO1xuICAgIGJhc2UgPSAnIFtGdW5jdGlvbicgKyBuICsgJ10nO1xuICB9XG5cbiAgLy8gTWFrZSBSZWdFeHBzIHNheSB0aGF0IHRoZXkgYXJlIFJlZ0V4cHNcbiAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBkYXRlcyB3aXRoIHByb3BlcnRpZXMgZmlyc3Qgc2F5IHRoZSBkYXRlXG4gIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIERhdGUucHJvdG90eXBlLnRvVVRDU3RyaW5nLmNhbGwodmFsdWUpO1xuICB9XG5cbiAgLy8gTWFrZSBlcnJvciB3aXRoIG1lc3NhZ2UgZmlyc3Qgc2F5IHRoZSBlcnJvclxuICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgaWYgKGtleXMubGVuZ3RoID09PSAwICYmICghYXJyYXkgfHwgdmFsdWUubGVuZ3RoID09IDApKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyBicmFjZXNbMV07XG4gIH1cblxuICBpZiAocmVjdXJzZVRpbWVzIDwgMCkge1xuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW09iamVjdF0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuXG4gIGN0eC5zZWVuLnB1c2godmFsdWUpO1xuXG4gIHZhciBvdXRwdXQ7XG4gIGlmIChhcnJheSkge1xuICAgIG91dHB1dCA9IGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpO1xuICB9IGVsc2Uge1xuICAgIG91dHB1dCA9IGtleXMubWFwKGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpO1xuICAgIH0pO1xuICB9XG5cbiAgY3R4LnNlZW4ucG9wKCk7XG5cbiAgcmV0dXJuIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSkge1xuICBpZiAoaXNVbmRlZmluZWQodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgndW5kZWZpbmVkJywgJ3VuZGVmaW5lZCcpO1xuICBpZiAoaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgdmFyIHNpbXBsZSA9ICdcXCcnICsgSlNPTi5zdHJpbmdpZnkodmFsdWUpLnJlcGxhY2UoL15cInxcIiQvZywgJycpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpICsgJ1xcJyc7XG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKHNpbXBsZSwgJ3N0cmluZycpO1xuICB9XG4gIGlmIChpc051bWJlcih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdudW1iZXInKTtcbiAgaWYgKGlzQm9vbGVhbih2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCcnICsgdmFsdWUsICdib29sZWFuJyk7XG4gIC8vIEZvciBzb21lIHJlYXNvbiB0eXBlb2YgbnVsbCBpcyBcIm9iamVjdFwiLCBzbyBzcGVjaWFsIGNhc2UgaGVyZS5cbiAgaWYgKGlzTnVsbCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCdudWxsJywgJ251bGwnKTtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRFcnJvcih2YWx1ZSkge1xuICByZXR1cm4gJ1snICsgRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpICsgJ10nO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEFycmF5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleXMpIHtcbiAgdmFyIG91dHB1dCA9IFtdO1xuICBmb3IgKHZhciBpID0gMCwgbCA9IHZhbHVlLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh2YWx1ZSwgU3RyaW5nKGkpKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBTdHJpbmcoaSksIHRydWUpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0LnB1c2goJycpO1xuICAgIH1cbiAgfVxuICBrZXlzLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgaWYgKCFrZXkubWF0Y2goL15cXGQrJC8pKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIGtleSwgdHJ1ZSkpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBvdXRwdXQ7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSkge1xuICB2YXIgbmFtZSwgc3RyLCBkZXNjO1xuICBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih2YWx1ZSwga2V5KSB8fCB7IHZhbHVlOiB2YWx1ZVtrZXldIH07XG4gIGlmIChkZXNjLmdldCkge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXIvU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChkZXNjLnNldCkge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tTZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFoYXNPd25Qcm9wZXJ0eSh2aXNpYmxlS2V5cywga2V5KSkge1xuICAgIG5hbWUgPSAnWycgKyBrZXkgKyAnXSc7XG4gIH1cbiAgaWYgKCFzdHIpIHtcbiAgICBpZiAoY3R4LnNlZW4uaW5kZXhPZihkZXNjLnZhbHVlKSA8IDApIHtcbiAgICAgIGlmIChpc051bGwocmVjdXJzZVRpbWVzKSkge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIG51bGwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCByZWN1cnNlVGltZXMgLSAxKTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHIuaW5kZXhPZignXFxuJykgPiAtMSkge1xuICAgICAgICBpZiAoYXJyYXkpIHtcbiAgICAgICAgICBzdHIgPSBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJykuc2xpY2UoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zbGljZSgxLCAtMSk7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ25hbWUnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJylcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLyheXCJ8XCIkKS9nLCBcIidcIik7XG4gICAgICBuYW1lID0gY3R4LnN0eWxpemUobmFtZSwgJ3N0cmluZycpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBuYW1lICsgJzogJyArIHN0cjtcbn1cblxuXG5mdW5jdGlvbiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcykge1xuICB2YXIgbnVtTGluZXNFc3QgPSAwO1xuICB2YXIgbGVuZ3RoID0gb3V0cHV0LnJlZHVjZShmdW5jdGlvbihwcmV2LCBjdXIpIHtcbiAgICBudW1MaW5lc0VzdCsrO1xuICAgIGlmIChjdXIuaW5kZXhPZignXFxuJykgPj0gMCkgbnVtTGluZXNFc3QrKztcbiAgICByZXR1cm4gcHJldiArIGN1ci5yZXBsYWNlKC9cXHUwMDFiXFxbXFxkXFxkP20vZywgJycpLmxlbmd0aCArIDE7XG4gIH0sIDApO1xuXG4gIGlmIChsZW5ndGggPiA2MCkge1xuICAgIHJldHVybiBicmFjZXNbMF0gK1xuICAgICAgICAgICAoYmFzZSA9PT0gJycgPyAnJyA6IGJhc2UgKyAnXFxuICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgb3V0cHV0LmpvaW4oJyxcXG4gICcpICtcbiAgICAgICAgICAgJyAnICtcbiAgICAgICAgICAgYnJhY2VzWzFdO1xuICB9XG5cbiAgcmV0dXJuIGJyYWNlc1swXSArIGJhc2UgKyAnICcgKyBvdXRwdXQuam9pbignLCAnKSArICcgJyArIGJyYWNlc1sxXTtcbn1cblxuXG4vLyBOT1RFOiBUaGVzZSB0eXBlIGNoZWNraW5nIGZ1bmN0aW9ucyBpbnRlbnRpb25hbGx5IGRvbid0IHVzZSBgaW5zdGFuY2VvZmBcbi8vIGJlY2F1c2UgaXQgaXMgZnJhZ2lsZSBhbmQgY2FuIGJlIGVhc2lseSBmYWtlZCB3aXRoIGBPYmplY3QuY3JlYXRlKClgLlxuZXhwb3J0cy50eXBlcyA9IHJlcXVpcmUoJy4vc3VwcG9ydC90eXBlcycpO1xuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuZXhwb3J0cy50eXBlcy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcbmV4cG9ydHMudHlwZXMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5leHBvcnRzLnR5cGVzLmlzTmF0aXZlRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gcmVxdWlyZSgnLi9zdXBwb3J0L2lzQnVmZmVyJyk7XG5cbmZ1bmN0aW9uIG9iamVjdFRvU3RyaW5nKG8pIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKTtcbn1cblxuXG5mdW5jdGlvbiBwYWQobikge1xuICByZXR1cm4gbiA8IDEwID8gJzAnICsgbi50b1N0cmluZygxMCkgOiBuLnRvU3RyaW5nKDEwKTtcbn1cblxuXG52YXIgbW9udGhzID0gWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsXG4gICAgICAgICAgICAgICdPY3QnLCAnTm92JywgJ0RlYyddO1xuXG4vLyAyNiBGZWIgMTY6MTk6MzRcbmZ1bmN0aW9uIHRpbWVzdGFtcCgpIHtcbiAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICB2YXIgdGltZSA9IFtwYWQoZC5nZXRIb3VycygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0TWludXRlcygpKSxcbiAgICAgICAgICAgICAgcGFkKGQuZ2V0U2Vjb25kcygpKV0uam9pbignOicpO1xuICByZXR1cm4gW2QuZ2V0RGF0ZSgpLCBtb250aHNbZC5nZXRNb250aCgpXSwgdGltZV0uam9pbignICcpO1xufVxuXG5cbi8vIGxvZyBpcyBqdXN0IGEgdGhpbiB3cmFwcGVyIHRvIGNvbnNvbGUubG9nIHRoYXQgcHJlcGVuZHMgYSB0aW1lc3RhbXBcbmV4cG9ydHMubG9nID0gZnVuY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKCclcyAtICVzJywgdGltZXN0YW1wKCksIGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cykpO1xufTtcblxuXG4vKipcbiAqIEluaGVyaXQgdGhlIHByb3RvdHlwZSBtZXRob2RzIGZyb20gb25lIGNvbnN0cnVjdG9yIGludG8gYW5vdGhlci5cbiAqXG4gKiBUaGUgRnVuY3Rpb24ucHJvdG90eXBlLmluaGVyaXRzIGZyb20gbGFuZy5qcyByZXdyaXR0ZW4gYXMgYSBzdGFuZGFsb25lXG4gKiBmdW5jdGlvbiAobm90IG9uIEZ1bmN0aW9uLnByb3RvdHlwZSkuIE5PVEU6IElmIHRoaXMgZmlsZSBpcyB0byBiZSBsb2FkZWRcbiAqIGR1cmluZyBib290c3RyYXBwaW5nIHRoaXMgZnVuY3Rpb24gbmVlZHMgdG8gYmUgcmV3cml0dGVuIHVzaW5nIHNvbWUgbmF0aXZlXG4gKiBmdW5jdGlvbnMgYXMgcHJvdG90eXBlIHNldHVwIHVzaW5nIG5vcm1hbCBKYXZhU2NyaXB0IGRvZXMgbm90IHdvcmsgYXNcbiAqIGV4cGVjdGVkIGR1cmluZyBib290c3RyYXBwaW5nIChzZWUgbWlycm9yLmpzIGluIHIxMTQ5MDMpLlxuICpcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gd2hpY2ggbmVlZHMgdG8gaW5oZXJpdCB0aGVcbiAqICAgICBwcm90b3R5cGUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBzdXBlckN0b3IgQ29uc3RydWN0b3IgZnVuY3Rpb24gdG8gaW5oZXJpdCBwcm90b3R5cGUgZnJvbS5cbiAqL1xuZXhwb3J0cy5pbmhlcml0cyA9IHJlcXVpcmUoJ2luaGVyaXRzJyk7XG5cbmV4cG9ydHMuX2V4dGVuZCA9IGZ1bmN0aW9uKG9yaWdpbiwgYWRkKSB7XG4gIC8vIERvbid0IGRvIGFueXRoaW5nIGlmIGFkZCBpc24ndCBhbiBvYmplY3RcbiAgaWYgKCFhZGQgfHwgIWlzT2JqZWN0KGFkZCkpIHJldHVybiBvcmlnaW47XG5cbiAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhhZGQpO1xuICB2YXIgaSA9IGtleXMubGVuZ3RoO1xuICB3aGlsZSAoaS0tKSB7XG4gICAgb3JpZ2luW2tleXNbaV1dID0gYWRkW2tleXNbaV1dO1xuICB9XG4gIHJldHVybiBvcmlnaW47XG59O1xuXG5mdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmosIHByb3ApIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApO1xufVxuXG52YXIga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sID0gdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgPyBTeW1ib2woJ3V0aWwucHJvbWlzaWZ5LmN1c3RvbScpIDogdW5kZWZpbmVkO1xuXG5leHBvcnRzLnByb21pc2lmeSA9IGZ1bmN0aW9uIHByb21pc2lmeShvcmlnaW5hbCkge1xuICBpZiAodHlwZW9mIG9yaWdpbmFsICE9PSAnZnVuY3Rpb24nKVxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBcIm9yaWdpbmFsXCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIEZ1bmN0aW9uJyk7XG5cbiAgaWYgKGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCAmJiBvcmlnaW5hbFtrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2xdKSB7XG4gICAgdmFyIGZuID0gb3JpZ2luYWxba0N1c3RvbVByb21pc2lmaWVkU3ltYm9sXTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdUaGUgXCJ1dGlsLnByb21pc2lmeS5jdXN0b21cIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRnVuY3Rpb24nKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGZuLCBrQ3VzdG9tUHJvbWlzaWZpZWRTeW1ib2wsIHtcbiAgICAgIHZhbHVlOiBmbiwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIGZuO1xuICB9XG5cbiAgZnVuY3Rpb24gZm4oKSB7XG4gICAgdmFyIHByb21pc2VSZXNvbHZlLCBwcm9taXNlUmVqZWN0O1xuICAgIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcHJvbWlzZVJlc29sdmUgPSByZXNvbHZlO1xuICAgICAgcHJvbWlzZVJlamVjdCA9IHJlamVjdDtcbiAgICB9KTtcblxuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgIH1cbiAgICBhcmdzLnB1c2goZnVuY3Rpb24gKGVyciwgdmFsdWUpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcHJvbWlzZVJlamVjdChlcnIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJvbWlzZVJlc29sdmUodmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdHJ5IHtcbiAgICAgIG9yaWdpbmFsLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcHJvbWlzZVJlamVjdChlcnIpO1xuICAgIH1cblxuICAgIHJldHVybiBwcm9taXNlO1xuICB9XG5cbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGZuLCBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob3JpZ2luYWwpKTtcblxuICBpZiAoa0N1c3RvbVByb21pc2lmaWVkU3ltYm9sKSBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sIGtDdXN0b21Qcm9taXNpZmllZFN5bWJvbCwge1xuICAgIHZhbHVlOiBmbiwgZW51bWVyYWJsZTogZmFsc2UsIHdyaXRhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pO1xuICByZXR1cm4gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMoXG4gICAgZm4sXG4gICAgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyhvcmlnaW5hbClcbiAgKTtcbn1cblxuZXhwb3J0cy5wcm9taXNpZnkuY3VzdG9tID0ga0N1c3RvbVByb21pc2lmaWVkU3ltYm9sXG5cbmZ1bmN0aW9uIGNhbGxiYWNraWZ5T25SZWplY3RlZChyZWFzb24sIGNiKSB7XG4gIC8vIGAhcmVhc29uYCBndWFyZCBpbnNwaXJlZCBieSBibHVlYmlyZCAoUmVmOiBodHRwczovL2dvby5nbC90NUlTNk0pLlxuICAvLyBCZWNhdXNlIGBudWxsYCBpcyBhIHNwZWNpYWwgZXJyb3IgdmFsdWUgaW4gY2FsbGJhY2tzIHdoaWNoIG1lYW5zIFwibm8gZXJyb3JcbiAgLy8gb2NjdXJyZWRcIiwgd2UgZXJyb3Itd3JhcCBzbyB0aGUgY2FsbGJhY2sgY29uc3VtZXIgY2FuIGRpc3Rpbmd1aXNoIGJldHdlZW5cbiAgLy8gXCJ0aGUgcHJvbWlzZSByZWplY3RlZCB3aXRoIG51bGxcIiBvciBcInRoZSBwcm9taXNlIGZ1bGZpbGxlZCB3aXRoIHVuZGVmaW5lZFwiLlxuICBpZiAoIXJlYXNvbikge1xuICAgIHZhciBuZXdSZWFzb24gPSBuZXcgRXJyb3IoJ1Byb21pc2Ugd2FzIHJlamVjdGVkIHdpdGggYSBmYWxzeSB2YWx1ZScpO1xuICAgIG5ld1JlYXNvbi5yZWFzb24gPSByZWFzb247XG4gICAgcmVhc29uID0gbmV3UmVhc29uO1xuICB9XG4gIHJldHVybiBjYihyZWFzb24pO1xufVxuXG5mdW5jdGlvbiBjYWxsYmFja2lmeShvcmlnaW5hbCkge1xuICBpZiAodHlwZW9mIG9yaWdpbmFsICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVGhlIFwib3JpZ2luYWxcIiBhcmd1bWVudCBtdXN0IGJlIG9mIHR5cGUgRnVuY3Rpb24nKTtcbiAgfVxuXG4gIC8vIFdlIERPIE5PVCByZXR1cm4gdGhlIHByb21pc2UgYXMgaXQgZ2l2ZXMgdGhlIHVzZXIgYSBmYWxzZSBzZW5zZSB0aGF0XG4gIC8vIHRoZSBwcm9taXNlIGlzIGFjdHVhbGx5IHNvbWVob3cgcmVsYXRlZCB0byB0aGUgY2FsbGJhY2sncyBleGVjdXRpb25cbiAgLy8gYW5kIHRoYXQgdGhlIGNhbGxiYWNrIHRocm93aW5nIHdpbGwgcmVqZWN0IHRoZSBwcm9taXNlLlxuICBmdW5jdGlvbiBjYWxsYmFja2lmaWVkKCkge1xuICAgIHZhciBhcmdzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgIH1cblxuICAgIHZhciBtYXliZUNiID0gYXJncy5wb3AoKTtcbiAgICBpZiAodHlwZW9mIG1heWJlQ2IgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1RoZSBsYXN0IGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBGdW5jdGlvbicpO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGNiID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbWF5YmVDYi5hcHBseShzZWxmLCBhcmd1bWVudHMpO1xuICAgIH07XG4gICAgLy8gSW4gdHJ1ZSBub2RlIHN0eWxlIHdlIHByb2Nlc3MgdGhlIGNhbGxiYWNrIG9uIGBuZXh0VGlja2Agd2l0aCBhbGwgdGhlXG4gICAgLy8gaW1wbGljYXRpb25zIChzdGFjaywgYHVuY2F1Z2h0RXhjZXB0aW9uYCwgYGFzeW5jX2hvb2tzYClcbiAgICBvcmlnaW5hbC5hcHBseSh0aGlzLCBhcmdzKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmV0KSB7IHByb2Nlc3MubmV4dFRpY2soY2IuYmluZChudWxsLCBudWxsLCByZXQpKSB9LFxuICAgICAgICAgICAgZnVuY3Rpb24ocmVqKSB7IHByb2Nlc3MubmV4dFRpY2soY2FsbGJhY2tpZnlPblJlamVjdGVkLmJpbmQobnVsbCwgcmVqLCBjYikpIH0pO1xuICB9XG5cbiAgT2JqZWN0LnNldFByb3RvdHlwZU9mKGNhbGxiYWNraWZpZWQsIE9iamVjdC5nZXRQcm90b3R5cGVPZihvcmlnaW5hbCkpO1xuICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhjYWxsYmFja2lmaWVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3JzKG9yaWdpbmFsKSk7XG4gIHJldHVybiBjYWxsYmFja2lmaWVkO1xufVxuZXhwb3J0cy5jYWxsYmFja2lmeSA9IGNhbGxiYWNraWZ5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZm9yRWFjaCA9IHJlcXVpcmUoJ2Zvci1lYWNoJyk7XG52YXIgYXZhaWxhYmxlVHlwZWRBcnJheXMgPSByZXF1aXJlKCdhdmFpbGFibGUtdHlwZWQtYXJyYXlzJyk7XG52YXIgY2FsbEJpbmQgPSByZXF1aXJlKCdjYWxsLWJpbmQnKTtcbnZhciBjYWxsQm91bmQgPSByZXF1aXJlKCdjYWxsLWJpbmQvY2FsbEJvdW5kJyk7XG52YXIgZ09QRCA9IHJlcXVpcmUoJ2dvcGQnKTtcblxudmFyICR0b1N0cmluZyA9IGNhbGxCb3VuZCgnT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZycpO1xudmFyIGhhc1RvU3RyaW5nVGFnID0gcmVxdWlyZSgnaGFzLXRvc3RyaW5ndGFnL3NoYW1zJykoKTtcblxudmFyIGcgPSB0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiBnbG9iYWxUaGlzO1xudmFyIHR5cGVkQXJyYXlzID0gYXZhaWxhYmxlVHlwZWRBcnJheXMoKTtcblxudmFyICRzbGljZSA9IGNhbGxCb3VuZCgnU3RyaW5nLnByb3RvdHlwZS5zbGljZScpO1xudmFyIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mOyAvLyByZXF1aXJlKCdnZXRwcm90b3R5cGVvZicpO1xuXG52YXIgJGluZGV4T2YgPSBjYWxsQm91bmQoJ0FycmF5LnByb3RvdHlwZS5pbmRleE9mJywgdHJ1ZSkgfHwgZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGlmIChhcnJheVtpXSA9PT0gdmFsdWUpIHtcblx0XHRcdHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRyZXR1cm4gLTE7XG59O1xudmFyIGNhY2hlID0geyBfX3Byb3RvX186IG51bGwgfTtcbmlmIChoYXNUb1N0cmluZ1RhZyAmJiBnT1BEICYmIGdldFByb3RvdHlwZU9mKSB7XG5cdGZvckVhY2godHlwZWRBcnJheXMsIGZ1bmN0aW9uICh0eXBlZEFycmF5KSB7XG5cdFx0dmFyIGFyciA9IG5ldyBnW3R5cGVkQXJyYXldKCk7XG5cdFx0aWYgKFN5bWJvbC50b1N0cmluZ1RhZyBpbiBhcnIpIHtcblx0XHRcdHZhciBwcm90byA9IGdldFByb3RvdHlwZU9mKGFycik7XG5cdFx0XHR2YXIgZGVzY3JpcHRvciA9IGdPUEQocHJvdG8sIFN5bWJvbC50b1N0cmluZ1RhZyk7XG5cdFx0XHRpZiAoIWRlc2NyaXB0b3IpIHtcblx0XHRcdFx0dmFyIHN1cGVyUHJvdG8gPSBnZXRQcm90b3R5cGVPZihwcm90byk7XG5cdFx0XHRcdGRlc2NyaXB0b3IgPSBnT1BEKHN1cGVyUHJvdG8sIFN5bWJvbC50b1N0cmluZ1RhZyk7XG5cdFx0XHR9XG5cdFx0XHRjYWNoZVsnJCcgKyB0eXBlZEFycmF5XSA9IGNhbGxCaW5kKGRlc2NyaXB0b3IuZ2V0KTtcblx0XHR9XG5cdH0pO1xufSBlbHNlIHtcblx0Zm9yRWFjaCh0eXBlZEFycmF5cywgZnVuY3Rpb24gKHR5cGVkQXJyYXkpIHtcblx0XHR2YXIgYXJyID0gbmV3IGdbdHlwZWRBcnJheV0oKTtcblx0XHRjYWNoZVsnJCcgKyB0eXBlZEFycmF5XSA9IGNhbGxCaW5kKGFyci5zbGljZSk7XG5cdH0pO1xufVxuXG52YXIgdHJ5VHlwZWRBcnJheXMgPSBmdW5jdGlvbiB0cnlBbGxUeXBlZEFycmF5cyh2YWx1ZSkge1xuXHR2YXIgZm91bmQgPSBmYWxzZTtcblx0Zm9yRWFjaChjYWNoZSwgZnVuY3Rpb24gKGdldHRlciwgdHlwZWRBcnJheSkge1xuXHRcdGlmICghZm91bmQpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGlmICgnJCcgKyBnZXR0ZXIodmFsdWUpID09PSB0eXBlZEFycmF5KSB7XG5cdFx0XHRcdFx0Zm91bmQgPSAkc2xpY2UodHlwZWRBcnJheSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH0gY2F0Y2ggKGUpIHsgLyoqLyB9XG5cdFx0fVxuXHR9KTtcblx0cmV0dXJuIGZvdW5kO1xufTtcblxudmFyIHRyeVNsaWNlcyA9IGZ1bmN0aW9uIHRyeUFsbFNsaWNlcyh2YWx1ZSkge1xuXHR2YXIgZm91bmQgPSBmYWxzZTtcblx0Zm9yRWFjaChjYWNoZSwgZnVuY3Rpb24gKGdldHRlciwgbmFtZSkge1xuXHRcdGlmICghZm91bmQpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdGdldHRlcih2YWx1ZSk7XG5cdFx0XHRcdGZvdW5kID0gJHNsaWNlKG5hbWUsIDEpO1xuXHRcdFx0fSBjYXRjaCAoZSkgeyAvKiovIH1cblx0XHR9XG5cdH0pO1xuXHRyZXR1cm4gZm91bmQ7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIHdoaWNoVHlwZWRBcnJheSh2YWx1ZSkge1xuXHRpZiAoIXZhbHVlIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHsgcmV0dXJuIGZhbHNlOyB9XG5cdGlmICghaGFzVG9TdHJpbmdUYWcpIHtcblx0XHR2YXIgdGFnID0gJHNsaWNlKCR0b1N0cmluZyh2YWx1ZSksIDgsIC0xKTtcblx0XHRpZiAoJGluZGV4T2YodHlwZWRBcnJheXMsIHRhZykgPiAtMSkge1xuXHRcdFx0cmV0dXJuIHRhZztcblx0XHR9XG5cdFx0aWYgKHRhZyAhPT0gJ09iamVjdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0Ly8gbm9kZSA8IDAuNiBoaXRzIGhlcmUgb24gcmVhbCBUeXBlZCBBcnJheXNcblx0XHRyZXR1cm4gdHJ5U2xpY2VzKHZhbHVlKTtcblx0fVxuXHRpZiAoIWdPUEQpIHsgcmV0dXJuIG51bGw7IH0gLy8gdW5rbm93biBlbmdpbmVcblx0cmV0dXJuIHRyeVR5cGVkQXJyYXlzKHZhbHVlKTtcbn07XG4iLCJcblxuKGZ1bmN0aW9uKCkge1xuXG5cbi8qIENvcHlyaWdodCAoYykgMjAxNCBUaGUgQ2hyb21pdW0gQXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGEgQlNELXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUuICovXG5cbi8qKlxuICogQGZpbGVvdmVydmlldyBMb3ctbGV2ZWwgRE9NIHRyYXZlcnNhbCB1dGlsaXR5IGZ1bmN0aW9ucyB0byBmaW5kIHRoZVxuICogICAgIG5leHQgKG9yIHByZXZpb3VzKSBjaGFyYWN0ZXIsIHdvcmQsIHNlbnRlbmNlLCBsaW5lLCBvciBwYXJhZ3JhcGgsXG4gKiAgICAgaW4gYSBjb21wbGV0ZWx5IHN0YXRlbGVzcyBtYW5uZXIgd2l0aG91dCBhY3R1YWxseSBtYW5pcHVsYXRpbmcgdGhlXG4gKiAgICAgc2VsZWN0aW9uLlxuICovXG5cbi8qKlxuICogQSBjbGFzcyB0byByZXByZXNlbnQgYSBjdXJzb3IgbG9jYXRpb24gaW4gdGhlIGRvY3VtZW50LFxuICogbGlrZSB0aGUgc3RhcnQgcG9zaXRpb24gb3IgZW5kIHBvc2l0aW9uIG9mIGEgc2VsZWN0aW9uIHJhbmdlLlxuICpcbiAqIExhdGVyIHRoaXMgbWF5IGJlIGV4dGVuZGVkIHRvIHN1cHBvcnQgXCJ2aXJ0dWFsIHRleHRcIiBmb3IgYW4gb2JqZWN0LFxuICogbGlrZSB0aGUgQUxUIHRleHQgZm9yIGFuIGltYWdlLlxuICpcbiAqIE5vdGU6IHdlIGNhY2hlIHRoZSB0ZXh0IG9mIGEgcGFydGljdWxhciBub2RlIGF0IHRoZSB0aW1lIHdlXG4gKiB0cmF2ZXJzZSBpbnRvIGl0LiBMYXRlciB3ZSBzaG91bGQgYWRkIHN1cHBvcnQgZm9yIGR5bmFtaWNhbGx5XG4gKiByZWxvYWRpbmcgaXQuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgVGhlIERPTSBub2RlLlxuICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY2hhcmFjdGVyIHdpdGhpbiB0aGUgbm9kZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0IFRoZSBjYWNoZWQgdGV4dCBjb250ZW50cyBvZiB0aGUgbm9kZS5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5jb25zdCBDdXJzb3IgPSBmdW5jdGlvbihub2RlLCBpbmRleCwgdGV4dCkge1xuICB0aGlzLm5vZGUgPSBub2RlO1xuICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gIHRoaXMudGV4dCA9IHRleHQ7XG59O1xuXG4vKipcbiAqIEByZXR1cm4ge0N1cnNvcn0gQSBuZXcgY3Vyc29yIHBvaW50aW5nIHRvIHRoZSBzYW1lIGxvY2F0aW9uLlxuICovXG5DdXJzb3IucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgQ3Vyc29yKHRoaXMubm9kZSwgdGhpcy5pbmRleCwgdGhpcy50ZXh0KTtcbn07XG5cbi8qKlxuICogTW9kaWZ5IHRoaXMgY3Vyc29yIHRvIHBvaW50IHRvIHRoZSBsb2NhdGlvbiB0aGF0IGFub3RoZXIgY3Vyc29yIHBvaW50cyB0by5cbiAqIEBwYXJhbSB7Q3Vyc29yfSBvdGhlckN1cnNvciBUaGUgY3Vyc29yIHRvIGNvcHkgZnJvbS5cbiAqL1xuQ3Vyc29yLnByb3RvdHlwZS5jb3B5RnJvbSA9IGZ1bmN0aW9uKG90aGVyQ3Vyc29yKSB7XG4gIHRoaXMubm9kZSA9IG90aGVyQ3Vyc29yLm5vZGU7XG4gIHRoaXMuaW5kZXggPSBvdGhlckN1cnNvci5pbmRleDtcbiAgdGhpcy50ZXh0ID0gb3RoZXJDdXJzb3IudGV4dDtcbn07XG5cbi8qKlxuICogVXRpbGl0eSBmdW5jdGlvbnMgZm9yIHN0YXRlbGVzcyBET00gdHJhdmVyc2FsLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmNvbnN0IFRyYXZlcnNlVXRpbCA9IGZ1bmN0aW9uKCkge307XG5cbi8qKlxuICogR2V0cyB0aGUgdGV4dCByZXByZXNlbnRhdGlvbiBvZiBhIG5vZGUuIFRoaXMgYWxsb3dzIHVzIHRvIHN1YnN0aXR1dGVcbiAqIGFsdCB0ZXh0LCBuYW1lcywgb3IgdGl0bGVzIGZvciBodG1sIGVsZW1lbnRzIHRoYXQgcHJvdmlkZSB0aGVtLlxuICogQHBhcmFtIHtOb2RlfSBub2RlIEEgRE9NIG5vZGUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IEEgdGV4dCBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG5vZGUuXG4gKi9cblRyYXZlcnNlVXRpbC5nZXROb2RlVGV4dCA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgaWYgKG5vZGUuY29uc3RydWN0b3IgPT0gVGV4dCkge1xuICAgIHJldHVybiBub2RlLmRhdGE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHVybiB0cnVlIGlmIGEgbm9kZSBzaG91bGQgYmUgdHJlYXRlZCBhcyBhIGxlYWYgbm9kZSwgYmVjYXVzZVxuICogaXRzIGNoaWxkcmVuIGFyZSBwcm9wZXJ0aWVzIG9mIHRoZSBvYmplY3QgdGhhdCBzaG91bGRuJ3QgYmUgdHJhdmVyc2VkLlxuICpcbiAqIFRPRE8oZG1henpvbmkpOiByZXBsYWNlIHRoaXMgd2l0aCBhIHByZWRpY2F0ZSB0aGF0IGRldGVjdHMgbm9kZXMgd2l0aFxuICogQVJJQSByb2xlcyBhbmQgb3RoZXIgb2JqZWN0cyB0aGF0IGhhdmUgdGhlaXIgb3duIGRlc2NyaXB0aW9uLlxuICogRm9yIG5vdyB3ZSBqdXN0IGRldGVjdCBhIGNvdXBsZSBvZiBjb21tb24gY2FzZXMuXG4gKlxuICogQHBhcmFtIHtOb2RlfSBub2RlIEEgRE9NIG5vZGUuXG4gKiBAcmV0dXJuIHtib29sZWFufSBUcnVlIGlmIHRoZSBub2RlIHNob3VsZCBiZSB0cmVhdGVkIGFzIGEgbGVhZiBub2RlLlxuICovXG5UcmF2ZXJzZVV0aWwudHJlYXRBc0xlYWZOb2RlID0gZnVuY3Rpb24obm9kZSkge1xuICByZXR1cm4gbm9kZS5jaGlsZE5vZGVzLmxlbmd0aCA9PSAwIHx8XG4gICAgICAgICBub2RlLm5vZGVOYW1lID09ICdTRUxFQ1QnIHx8XG4gICAgICAgICBub2RlLm5vZGVOYW1lID09ICdPQkpFQ1QnO1xufTtcblxuLyoqXG4gKiBSZXR1cm4gdHJ1ZSBvbmx5IGlmIGEgc2luZ2xlIGNoYXJhY3RlciBpcyB3aGl0ZXNwYWNlLlxuICogRnJvbSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi9XaGl0ZXNwYWNlX2luX3RoZV9ET00sXG4gKiB3aGl0ZXNwYWNlIGlzIGRlZmluZWQgYXMgb25lIG9mIHRoZSBjaGFyYWN0ZXJzXG4gKiAgXCJcXHRcIiBUQUIgXFx1MDAwOVxuICogIFwiXFxuXCIgTEYgIFxcdTAwMEFcbiAqICBcIlxcclwiIENSICBcXHUwMDBEXG4gKiAgXCIgXCIgIFNQQyBcXHUwMDIwLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjIEEgc3RyaW5nIGNvbnRhaW5pbmcgYSBzaW5nbGUgY2hhcmFjdGVyLlxuICogQHJldHVybiB7Ym9vbGVhbn0gVHJ1ZSBpZiB0aGUgY2hhcmFjdGVyIGlzIHdoaXRlc3BhY2UsIG90aGVyd2lzZSBmYWxzZS5cbiAqL1xuVHJhdmVyc2VVdGlsLmlzV2hpdGVzcGFjZSA9IGZ1bmN0aW9uKGMpIHtcbiAgcmV0dXJuIChjID09ICcgJyB8fCBjID09ICdcXG4nIHx8IGMgPT0gJ1xccicgfHwgYyA9PSAnXFx0Jyk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgc2VsZWN0aW9uIHRvIHRoZSByYW5nZSBiZXR3ZWVuIHRoZSBnaXZlbiBzdGFydCBhbmQgZW5kIGN1cnNvcnMuXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnQgVGhlIGRlc2lyZWQgc3RhcnQgb2YgdGhlIHNlbGVjdGlvbi5cbiAqIEBwYXJhbSB7Q3Vyc29yfSBlbmQgVGhlIGRlc2lyZWQgZW5kIG9mIHRoZSBzZWxlY3Rpb24uXG4gKiBAcmV0dXJuIHtTZWxlY3Rpb259IHRoZSBzZWxlY3Rpb24gb2JqZWN0LlxuICovXG5UcmF2ZXJzZVV0aWwuc2V0U2VsZWN0aW9uID0gZnVuY3Rpb24oc3RhcnQsIGVuZCkge1xuICB2YXIgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gIHJhbmdlLnNldFN0YXJ0KHN0YXJ0Lm5vZGUsIHN0YXJ0LmluZGV4KTtcbiAgcmFuZ2Uuc2V0RW5kKGVuZC5ub2RlLCBlbmQuaW5kZXgpO1xuICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xuXG4gIHJldHVybiBzZWw7XG59O1xuXG4vKipcbiAqIFVzZSB0aGUgY29tcHV0ZWQgQ1NTIHN0eWxlIHRvIGZpZ3VyZSBvdXQgaWYgdGhpcyBET00gbm9kZSBpcyBjdXJyZW50bHlcbiAqIHZpc2libGUuXG4gKiBAcGFyYW0ge05vZGV9IG5vZGUgQSBIVE1MIERPTSBub2RlLlxuICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciBvciBub3QgdGhlIGh0bWwgbm9kZSBpcyB2aXNpYmxlLlxuICovXG5UcmF2ZXJzZVV0aWwuaXNWaXNpYmxlID0gZnVuY3Rpb24obm9kZSkge1xuICBpZiAoIW5vZGUuc3R5bGUpXG4gICAgcmV0dXJuIHRydWU7XG4gIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKC8qKiBAdHlwZSB7RWxlbWVudH0gKi8obm9kZSksIG51bGwpO1xuICByZXR1cm4gKCEhc3R5bGUgJiYgc3R5bGUuZGlzcGxheSAhPSAnbm9uZScgJiYgc3R5bGUudmlzaWJpbGl0eSAhPSAnaGlkZGVuJyk7XG59O1xuXG4vKipcbiAqIFVzZSB0aGUgY2xhc3MgbmFtZSB0byBmaWd1cmUgb3V0IGlmIHRoaXMgRE9NIG5vZGUgc2hvdWxkIGJlIHRyYXZlcnNlZC5cbiAqIEBwYXJhbSB7Tm9kZX0gbm9kZSBBIEhUTUwgRE9NIG5vZGUuXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIG9yIG5vdCB0aGUgaHRtbCBub2RlIHNob3VsZCBiZSB0cmF2ZXJzZWQuXG4gKi9cblRyYXZlcnNlVXRpbC5pc1NraXBwZWQgPSBmdW5jdGlvbihub2RlKSB7XG4gIGlmIChub2RlLmNvbnN0cnVjdG9yID09IFRleHQpXG4gICAgbm9kZSA9IG5vZGUucGFyZW50RWxlbWVudDtcbiAgaWYgKG5vZGUuY2xhc3NOYW1lID09ICdDYXJldEJyb3dzaW5nX0NhcmV0JyB8fFxuICAgICAgbm9kZS5jbGFzc05hbWUgPT0gJ0NhcmV0QnJvd3NpbmdfQW5pbWF0ZUNhcmV0Jykge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbi8qKlxuICogTW92ZXMgdGhlIGN1cnNvciBmb3J3YXJkcyB1bnRpbCBpdCBoYXMgY3Jvc3NlZCBleGFjdGx5IG9uZSBjaGFyYWN0ZXIuXG4gKiBAcGFyYW0ge0N1cnNvcn0gY3Vyc29yIFRoZSBjdXJzb3IgbG9jYXRpb24gd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiAgICAgT24gZXhpdCwgdGhlIGN1cnNvciB3aWxsIGJlIGltbWVkaWF0ZWx5IHRvIHRoZSByaWdodCBvZiB0aGVcbiAqICAgICBjaGFyYWN0ZXIgcmV0dXJuZWQuXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBub2Rlc0Nyb3NzZWQgQW55IEhUTUwgbm9kZXMgY3Jvc3NlZCBiZXR3ZWVuIHRoZVxuICogICAgIGluaXRpYWwgYW5kIGZpbmFsIGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHB1c2hlZCBvbnRvIHRoaXMgYXJyYXkuXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgY2hhcmFjdGVyIGZvdW5kLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmZvcndhcmRzQ2hhciA9IGZ1bmN0aW9uKGN1cnNvciwgbm9kZXNDcm9zc2VkKSB7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgLy8gTW92ZSBkb3duIHVudGlsIHdlIGdldCB0byBhIGxlYWYgbm9kZS5cbiAgICB2YXIgY2hpbGROb2RlID0gbnVsbDtcbiAgICBpZiAoIVRyYXZlcnNlVXRpbC50cmVhdEFzTGVhZk5vZGUoY3Vyc29yLm5vZGUpKSB7XG4gICAgICBmb3IgKHZhciBpID0gY3Vyc29yLmluZGV4OyBpIDwgY3Vyc29yLm5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgbm9kZSA9IGN1cnNvci5ub2RlLmNoaWxkTm9kZXNbaV07XG4gICAgICAgIGlmIChUcmF2ZXJzZVV0aWwuaXNTa2lwcGVkKG5vZGUpKSB7XG4gICAgICAgICAgbm9kZXNDcm9zc2VkLnB1c2gobm9kZSk7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFRyYXZlcnNlVXRpbC5pc1Zpc2libGUobm9kZSkpIHtcbiAgICAgICAgICBjaGlsZE5vZGUgPSBub2RlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChjaGlsZE5vZGUpIHtcbiAgICAgIGN1cnNvci5ub2RlID0gY2hpbGROb2RlO1xuICAgICAgY3Vyc29yLmluZGV4ID0gMDtcbiAgICAgIGN1cnNvci50ZXh0ID0gVHJhdmVyc2VVdGlsLmdldE5vZGVUZXh0KGN1cnNvci5ub2RlKTtcbiAgICAgIGlmIChjdXJzb3Iubm9kZS5jb25zdHJ1Y3RvciAhPSBUZXh0KSB7XG4gICAgICAgIG5vZGVzQ3Jvc3NlZC5wdXNoKGN1cnNvci5ub2RlKTtcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgbmV4dCBjaGFyYWN0ZXIgZnJvbSB0aGlzIGxlYWYgbm9kZS5cbiAgICBpZiAoY3Vyc29yLmluZGV4IDwgY3Vyc29yLnRleHQubGVuZ3RoKVxuICAgICAgcmV0dXJuIGN1cnNvci50ZXh0W2N1cnNvci5pbmRleCsrXTtcblxuICAgIC8vIE1vdmUgdG8gdGhlIG5leHQgc2libGluZywgZ29pbmcgdXAgdGhlIHRyZWUgYXMgbmVjZXNzYXJ5LlxuICAgIHdoaWxlIChjdXJzb3Iubm9kZSAhPSBudWxsKSB7XG4gICAgICAvLyBUcnkgdG8gbW92ZSB0byB0aGUgbmV4dCBzaWJsaW5nLlxuICAgICAgdmFyIHNpYmxpbmdOb2RlID0gbnVsbDtcbiAgICAgIGZvciAodmFyIG5vZGUgPSBjdXJzb3Iubm9kZS5uZXh0U2libGluZztcbiAgICAgICAgICAgbm9kZSAhPSBudWxsO1xuICAgICAgICAgICBub2RlID0gbm9kZS5uZXh0U2libGluZykge1xuICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2RlKSkge1xuICAgICAgICAgIG5vZGVzQ3Jvc3NlZC5wdXNoKG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChUcmF2ZXJzZVV0aWwuaXNWaXNpYmxlKG5vZGUpKSB7XG4gICAgICAgICAgc2libGluZ05vZGUgPSBub2RlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2libGluZ05vZGUpIHtcbiAgICAgICAgY3Vyc29yLm5vZGUgPSBzaWJsaW5nTm9kZTtcbiAgICAgICAgY3Vyc29yLnRleHQgPSBUcmF2ZXJzZVV0aWwuZ2V0Tm9kZVRleHQoc2libGluZ05vZGUpO1xuICAgICAgICBjdXJzb3IuaW5kZXggPSAwO1xuXG4gICAgICAgIGlmIChjdXJzb3Iubm9kZS5jb25zdHJ1Y3RvciAhPSBUZXh0KSB7XG4gICAgICAgICAgbm9kZXNDcm9zc2VkLnB1c2goY3Vyc29yLm5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIE90aGVyd2lzZSwgbW92ZSB0byB0aGUgcGFyZW50LlxuICAgICAgaWYgKGN1cnNvci5ub2RlLnBhcmVudE5vZGUgJiZcbiAgICAgICAgICBjdXJzb3Iubm9kZS5wYXJlbnROb2RlLmNvbnN0cnVjdG9yICE9IEhUTUxCb2R5RWxlbWVudCkge1xuICAgICAgICBjdXJzb3Iubm9kZSA9IGN1cnNvci5ub2RlLnBhcmVudE5vZGU7XG4gICAgICAgIGN1cnNvci50ZXh0ID0gbnVsbDtcbiAgICAgICAgY3Vyc29yLmluZGV4ID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBNb3ZlcyB0aGUgY3Vyc29yIGJhY2t3YXJkcyB1bnRpbCBpdCBoYXMgY3Jvc3NlZCBleGFjdGx5IG9uZSBjaGFyYWN0ZXIuXG4gKiBAcGFyYW0ge0N1cnNvcn0gY3Vyc29yIFRoZSBjdXJzb3IgbG9jYXRpb24gd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnQuXG4gKiAgICAgT24gZXhpdCwgdGhlIGN1cnNvciB3aWxsIGJlIGltbWVkaWF0ZWx5IHRvIHRoZSBsZWZ0IG9mIHRoZVxuICogICAgIGNoYXJhY3RlciByZXR1cm5lZC5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBwcmV2aW91cyBjaGFyYWN0ZXIsIG9yIG51bGwgaWYgdGhlIHRvcCBvZiB0aGVcbiAqICAgICBkb2N1bWVudCBoYXMgYmVlbiByZWFjaGVkLlxuICovXG5UcmF2ZXJzZVV0aWwuYmFja3dhcmRzQ2hhciA9IGZ1bmN0aW9uKGN1cnNvciwgbm9kZXNDcm9zc2VkKSB7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgLy8gTW92ZSBkb3duIHVudGlsIHdlIGdldCB0byBhIGxlYWYgbm9kZS5cbiAgICB2YXIgY2hpbGROb2RlID0gbnVsbDtcbiAgICBpZiAoIVRyYXZlcnNlVXRpbC50cmVhdEFzTGVhZk5vZGUoY3Vyc29yLm5vZGUpKSB7XG4gICAgICBmb3IgKHZhciBpID0gY3Vyc29yLmluZGV4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdmFyIG5vZGUgPSBjdXJzb3Iubm9kZS5jaGlsZE5vZGVzW2ldO1xuICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2RlKSkge1xuICAgICAgICAgIG5vZGVzQ3Jvc3NlZC5wdXNoKG5vZGUpO1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChUcmF2ZXJzZVV0aWwuaXNWaXNpYmxlKG5vZGUpKSB7XG4gICAgICAgICAgY2hpbGROb2RlID0gbm9kZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hpbGROb2RlKSB7XG4gICAgICBjdXJzb3Iubm9kZSA9IGNoaWxkTm9kZTtcbiAgICAgIGN1cnNvci50ZXh0ID0gVHJhdmVyc2VVdGlsLmdldE5vZGVUZXh0KGN1cnNvci5ub2RlKTtcbiAgICAgIGlmIChjdXJzb3IudGV4dC5sZW5ndGgpXG4gICAgICAgIGN1cnNvci5pbmRleCA9IGN1cnNvci50ZXh0Lmxlbmd0aDtcbiAgICAgIGVsc2VcbiAgICAgICAgY3Vyc29yLmluZGV4ID0gY3Vyc29yLm5vZGUuY2hpbGROb2Rlcy5sZW5ndGg7XG4gICAgICBpZiAoY3Vyc29yLm5vZGUuY29uc3RydWN0b3IgIT0gVGV4dClcbiAgICAgICAgbm9kZXNDcm9zc2VkLnB1c2goY3Vyc29yLm5vZGUpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIHRoZSBwcmV2aW91cyBjaGFyYWN0ZXIgZnJvbSB0aGlzIGxlYWYgbm9kZS5cbiAgICBpZiAoY3Vyc29yLnRleHQubGVuZ3RoID4gMCAmJiBjdXJzb3IuaW5kZXggPiAwKSB7XG4gICAgICByZXR1cm4gY3Vyc29yLnRleHRbLS1jdXJzb3IuaW5kZXhdO1xuICAgIH1cblxuICAgIC8vIE1vdmUgdG8gdGhlIHByZXZpb3VzIHNpYmxpbmcsIGdvaW5nIHVwIHRoZSB0cmVlIGFzIG5lY2Vzc2FyeS5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgLy8gVHJ5IHRvIG1vdmUgdG8gdGhlIHByZXZpb3VzIHNpYmxpbmcuXG4gICAgICB2YXIgc2libGluZ05vZGUgPSBudWxsO1xuICAgICAgZm9yICh2YXIgbm9kZSA9IGN1cnNvci5ub2RlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgbm9kZSAhPSBudWxsO1xuICAgICAgICAgICBub2RlID0gbm9kZS5wcmV2aW91c1NpYmxpbmcpIHtcbiAgICAgICAgaWYgKFRyYXZlcnNlVXRpbC5pc1NraXBwZWQobm9kZSkpIHtcbiAgICAgICAgICBub2Rlc0Nyb3NzZWQucHVzaChub2RlKTtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzVmlzaWJsZShub2RlKSkge1xuICAgICAgICAgIHNpYmxpbmdOb2RlID0gbm9kZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNpYmxpbmdOb2RlKSB7XG4gICAgICAgIGN1cnNvci5ub2RlID0gc2libGluZ05vZGU7XG4gICAgICAgIGN1cnNvci50ZXh0ID0gVHJhdmVyc2VVdGlsLmdldE5vZGVUZXh0KHNpYmxpbmdOb2RlKTtcbiAgICAgICAgaWYgKGN1cnNvci50ZXh0Lmxlbmd0aClcbiAgICAgICAgICBjdXJzb3IuaW5kZXggPSBjdXJzb3IudGV4dC5sZW5ndGg7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjdXJzb3IuaW5kZXggPSBjdXJzb3Iubm9kZS5jaGlsZE5vZGVzLmxlbmd0aDtcbiAgICAgICAgaWYgKGN1cnNvci5ub2RlLmNvbnN0cnVjdG9yICE9IFRleHQpXG4gICAgICAgICAgbm9kZXNDcm9zc2VkLnB1c2goY3Vyc29yLm5vZGUpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlLCBtb3ZlIHRvIHRoZSBwYXJlbnQuXG4gICAgICBpZiAoY3Vyc29yLm5vZGUucGFyZW50Tm9kZSAmJlxuICAgICAgICAgIGN1cnNvci5ub2RlLnBhcmVudE5vZGUuY29uc3RydWN0b3IgIT0gSFRNTEJvZHlFbGVtZW50KSB7XG4gICAgICAgIGN1cnNvci5ub2RlID0gY3Vyc29yLm5vZGUucGFyZW50Tm9kZTtcbiAgICAgICAgY3Vyc29yLnRleHQgPSBudWxsO1xuICAgICAgICBjdXJzb3IuaW5kZXggPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSBuZXh0IGNoYXJhY3Rlciwgc3RhcnRpbmcgZnJvbSBlbmRDdXJzb3IuICBVcG9uIGV4aXQsIHN0YXJ0Q3Vyc29yXG4gKiBhbmQgZW5kQ3Vyc29yIHdpbGwgc3Vycm91bmQgdGhlIG5leHQgY2hhcmFjdGVyLiBJZiBza2lwV2hpdGVzcGFjZSBpc1xuICogdHJ1ZSwgd2lsbCBza2lwIHVudGlsIGEgcmVhbCBjaGFyYWN0ZXIgaXMgZm91bmQuIE90aGVyd2lzZSwgaXQgd2lsbFxuICogYXR0ZW1wdCB0byBzZWxlY3QgYWxsIG9mIHRoZSB3aGl0ZXNwYWNlIGJldHdlZW4gdGhlIGluaXRpYWwgcG9zaXRpb25cbiAqIG9mIGVuZEN1cnNvciBhbmQgdGhlIG5leHQgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyLlxuICogQHBhcmFtIHtDdXJzb3J9IHN0YXJ0Q3Vyc29yIE9uIGV4aXQsIHBvaW50cyB0byB0aGUgcG9zaXRpb24gYmVmb3JlXG4gKiAgICAgdGhlIGNoYXIuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIFRoZSBwb3NpdGlvbiB0byBzdGFydCBzZWFyY2hpbmcgZm9yIHRoZSBuZXh0XG4gKiAgICAgY2hhci4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIHBvc2l0aW9uIHBhc3QgdGhlIGNoYXIuXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBub2Rlc0Nyb3NzZWQgQW55IEhUTUwgbm9kZXMgY3Jvc3NlZCBiZXR3ZWVuIHRoZVxuICogICAgIGluaXRpYWwgYW5kIGZpbmFsIGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHB1c2hlZCBvbnRvIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0ge2Jvb2xlYW59IHNraXBXaGl0ZXNwYWNlIElmIHRydWUsIHdpbGwga2VlcCBzY2FubmluZyB1bnRpbCBhXG4gKiAgICAgbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVyIGlzIGZvdW5kLlxuICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5leHQgY2hhciwgb3IgbnVsbCBpZiB0aGUgYm90dG9tIG9mIHRoZVxuICogICAgIGRvY3VtZW50IGhhcyBiZWVuIHJlYWNoZWQuXG4gKi9cblRyYXZlcnNlVXRpbC5nZXROZXh0Q2hhciA9IGZ1bmN0aW9uKFxuICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCwgc2tpcFdoaXRlc3BhY2UpIHtcblxuICAvLyBTYXZlIHRoZSBzdGFydGluZyBwb3NpdGlvbiBhbmQgZ2V0IHRoZSBmaXJzdCBjaGFyYWN0ZXIuXG4gIHN0YXJ0Q3Vyc29yLmNvcHlGcm9tKGVuZEN1cnNvcik7XG4gIHZhciBjID0gVHJhdmVyc2VVdGlsLmZvcndhcmRzQ2hhcihlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCk7XG4gIGlmIChjID09IG51bGwpXG4gICAgcmV0dXJuIG51bGw7XG5cbiAgLy8gS2VlcCB0cmFjayBvZiB3aGV0aGVyIHRoZSBmaXJzdCBjaGFyYWN0ZXIgd2FzIHdoaXRlc3BhY2UuXG4gIHZhciBpbml0aWFsV2hpdGVzcGFjZSA9IFRyYXZlcnNlVXRpbC5pc1doaXRlc3BhY2UoYyk7XG5cbiAgLy8gS2VlcCBzY2FubmluZyB1bnRpbCB3ZSBmaW5kIGEgbm9uLXdoaXRlc3BhY2Ugb3Igbm9uLXNraXBwZWQgY2hhcmFjdGVyLlxuICB3aGlsZSAoKFRyYXZlcnNlVXRpbC5pc1doaXRlc3BhY2UoYykpIHx8XG4gICAgICAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChlbmRDdXJzb3Iubm9kZSkpKSB7XG4gICAgYyA9IFRyYXZlcnNlVXRpbC5mb3J3YXJkc0NoYXIoZW5kQ3Vyc29yLCBub2Rlc0Nyb3NzZWQpO1xuICAgIGlmIChjID09IG51bGwpXG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoc2tpcFdoaXRlc3BhY2UgfHwgIWluaXRpYWxXaGl0ZXNwYWNlKSB7XG4gICAgLy8gSWYgc2tpcFdoaXRlcGFjZSBpcyB0cnVlLCBvciBpZiB0aGUgZmlyc3QgY2hhcmFjdGVyIHdlIGVuY291bnRlcmVkXG4gICAgLy8gd2FzIG5vdCB3aGl0ZXNwYWNlLCByZXR1cm4gdGhhdCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gICAgc3RhcnRDdXJzb3IuY29weUZyb20oZW5kQ3Vyc29yKTtcbiAgICBzdGFydEN1cnNvci5pbmRleC0tO1xuICAgIHJldHVybiBjO1xuICB9XG4gIGVsc2Uge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXNDcm9zc2VkLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2Rlc0Nyb3NzZWRbaV0pKSB7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciBhcmVuJ3RcbiAgICAgICAgLy8gc3Vycm91bmRpbmcgYSBza2lwcGFibGUgbm9kZS5cbiAgICAgICAgZW5kQ3Vyc29yLmluZGV4LS07XG4gICAgICAgIHN0YXJ0Q3Vyc29yLmNvcHlGcm9tKGVuZEN1cnNvcik7XG4gICAgICAgIHN0YXJ0Q3Vyc29yLmluZGV4LS07XG4gICAgICAgIHJldHVybiAnICc7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIE90aGVyd2lzZSwgcmV0dXJuIGFsbCBvZiB0aGUgd2hpdGVzcGFjZSBiZWZvcmUgdGhhdCBsYXN0IGNoYXJhY3Rlci5cbiAgICBlbmRDdXJzb3IuaW5kZXgtLTtcbiAgICByZXR1cm4gJyAnO1xuICB9XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSBwcmV2aW91cyBjaGFyYWN0ZXIsIHN0YXJ0aW5nIGZyb20gc3RhcnRDdXJzb3IuICBVcG9uIGV4aXQsXG4gKiBzdGFydEN1cnNvciBhbmQgZW5kQ3Vyc29yIHdpbGwgc3Vycm91bmQgdGhlIHByZXZpb3VzIGNoYXJhY3Rlci5cbiAqIElmIHNraXBXaGl0ZXNwYWNlIGlzIHRydWUsIHdpbGwgc2tpcCB1bnRpbCBhIHJlYWwgY2hhcmFjdGVyIGlzIGZvdW5kLlxuICogT3RoZXJ3aXNlLCBpdCB3aWxsIGF0dGVtcHQgdG8gc2VsZWN0IGFsbCBvZiB0aGUgd2hpdGVzcGFjZSBiZXR3ZWVuXG4gKiB0aGUgaW5pdGlhbCBwb3NpdGlvbiBvZiBlbmRDdXJzb3IgYW5kIHRoZSBuZXh0IG5vbi13aGl0ZXNwYWNlIGNoYXJhY3Rlci5cbiAqIEBwYXJhbSB7Q3Vyc29yfSBzdGFydEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGVcbiAqICAgICBjaGFyLiBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBwb3NpdGlvbiBiZWZvcmUgdGhlIGNoYXIuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIFRoZSBwb3NpdGlvbiB0byBzdGFydCBzZWFyY2hpbmcgZm9yIHRoZSBuZXh0XG4gKiAgICAgY2hhci4gT24gZXhpdCwgd2lsbCBwb2ludCB0byB0aGUgcG9zaXRpb24gcGFzdCB0aGUgY2hhci5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEBwYXJhbSB7Ym9vbGVhbn0gc2tpcFdoaXRlc3BhY2UgSWYgdHJ1ZSwgd2lsbCBrZWVwIHNjYW5uaW5nIHVudGlsIGFcbiAqICAgICBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIgaXMgZm91bmQuXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgcHJldmlvdXMgY2hhciwgb3IgbnVsbCBpZiB0aGUgdG9wIG9mIHRoZVxuICogICAgIGRvY3VtZW50IGhhcyBiZWVuIHJlYWNoZWQuXG4gKi9cblRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c0NoYXIgPSBmdW5jdGlvbihcbiAgICBzdGFydEN1cnNvciwgZW5kQ3Vyc29yLCBub2Rlc0Nyb3NzZWQsIHNraXBXaGl0ZXNwYWNlKSB7XG5cbiAgLy8gU2F2ZSB0aGUgc3RhcnRpbmcgcG9zaXRpb24gYW5kIGdldCB0aGUgZmlyc3QgY2hhcmFjdGVyLlxuICBlbmRDdXJzb3IuY29weUZyb20oc3RhcnRDdXJzb3IpO1xuICB2YXIgYyA9IFRyYXZlcnNlVXRpbC5iYWNrd2FyZHNDaGFyKHN0YXJ0Q3Vyc29yLCBub2Rlc0Nyb3NzZWQpO1xuICBpZiAoYyA9PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuXG4gIC8vIEtlZXAgdHJhY2sgb2Ygd2hldGhlciB0aGUgZmlyc3QgY2hhcmFjdGVyIHdhcyB3aGl0ZXNwYWNlLlxuICB2YXIgaW5pdGlhbFdoaXRlc3BhY2UgPSBUcmF2ZXJzZVV0aWwuaXNXaGl0ZXNwYWNlKGMpO1xuXG4gIC8vIEtlZXAgc2Nhbm5pbmcgdW50aWwgd2UgZmluZCBhIG5vbi13aGl0ZXNwYWNlIG9yIG5vbi1za2lwcGVkIGNoYXJhY3Rlci5cbiAgd2hpbGUgKChUcmF2ZXJzZVV0aWwuaXNXaGl0ZXNwYWNlKGMpKSB8fFxuICAgICAgKFRyYXZlcnNlVXRpbC5pc1NraXBwZWQoc3RhcnRDdXJzb3Iubm9kZSkpKSB7XG4gICAgYyA9IFRyYXZlcnNlVXRpbC5iYWNrd2FyZHNDaGFyKHN0YXJ0Q3Vyc29yLCBub2Rlc0Nyb3NzZWQpO1xuICAgIGlmIChjID09IG51bGwpXG4gICAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBpZiAoc2tpcFdoaXRlc3BhY2UgfHwgIWluaXRpYWxXaGl0ZXNwYWNlKSB7XG4gICAgLy8gSWYgc2tpcFdoaXRlcGFjZSBpcyB0cnVlLCBvciBpZiB0aGUgZmlyc3QgY2hhcmFjdGVyIHdlIGVuY291bnRlcmVkXG4gICAgLy8gd2FzIG5vdCB3aGl0ZXNwYWNlLCByZXR1cm4gdGhhdCBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXIuXG4gICAgZW5kQ3Vyc29yLmNvcHlGcm9tKHN0YXJ0Q3Vyc29yKTtcbiAgICBlbmRDdXJzb3IuaW5kZXgrKztcbiAgICByZXR1cm4gYztcbiAgfSBlbHNlIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzQ3Jvc3NlZC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKFRyYXZlcnNlVXRpbC5pc1NraXBwZWQobm9kZXNDcm9zc2VkW2ldKSkge1xuICAgICAgICBzdGFydEN1cnNvci5pbmRleCsrO1xuICAgICAgICBlbmRDdXJzb3IuY29weUZyb20oc3RhcnRDdXJzb3IpO1xuICAgICAgICBlbmRDdXJzb3IuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuICcgJztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gT3RoZXJ3aXNlLCByZXR1cm4gYWxsIG9mIHRoZSB3aGl0ZXNwYWNlIGJlZm9yZSB0aGF0IGxhc3QgY2hhcmFjdGVyLlxuICAgIHN0YXJ0Q3Vyc29yLmluZGV4Kys7XG4gICAgcmV0dXJuICcgJztcbiAgfVxufTtcblxuLyoqXG4gKiBGaW5kcyB0aGUgbmV4dCB3b3JkLCBzdGFydGluZyBmcm9tIGVuZEN1cnNvci4gIFVwb24gZXhpdCwgc3RhcnRDdXJzb3JcbiAqIGFuZCBlbmRDdXJzb3Igd2lsbCBzdXJyb3VuZCB0aGUgbmV4dCB3b3JkLiAgQSB3b3JkIGlzIGRlZmluZWQgdG8gYmVcbiAqIGEgc3RyaW5nIG9mIDEgb3IgbW9yZSBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluIHRoZSBzYW1lIERPTSBub2RlLlxuICogQHBhcmFtIHtDdXJzb3J9IHN0YXJ0Q3Vyc29yIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAqICAgICB3b3JkIHJldHVybmVkLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgbmV4dFxuICogICAgIHdvcmQuICBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBlbmQgb2YgdGhlIHdvcmQgcmV0dXJuZWQuXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBub2Rlc0Nyb3NzZWQgQW55IEhUTUwgbm9kZXMgY3Jvc3NlZCBiZXR3ZWVuIHRoZVxuICogICAgIGluaXRpYWwgYW5kIGZpbmFsIGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHB1c2hlZCBvbnRvIHRoaXMgYXJyYXkuXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmV4dCB3b3JkLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmdldE5leHRXb3JkID0gZnVuY3Rpb24oc3RhcnRDdXJzb3IsIGVuZEN1cnNvcixcbiAgICBub2Rlc0Nyb3NzZWQpIHtcblxuICAvLyBGaW5kIHRoZSBmaXJzdCBub24td2hpdGVzcGFjZSBvciBub24tc2tpcHBlZCBjaGFyYWN0ZXIuXG4gIHZhciBjdXJzb3IgPSBlbmRDdXJzb3IuY2xvbmUoKTtcbiAgdmFyIGMgPSBUcmF2ZXJzZVV0aWwuZm9yd2FyZHNDaGFyKGN1cnNvciwgbm9kZXNDcm9zc2VkKTtcbiAgaWYgKGMgPT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgd2hpbGUgKChUcmF2ZXJzZVV0aWwuaXNXaGl0ZXNwYWNlKGMpKSB8fFxuICAgICAgKFRyYXZlcnNlVXRpbC5pc1NraXBwZWQoY3Vyc29yLm5vZGUpKSkge1xuICAgIGMgPSBUcmF2ZXJzZVV0aWwuZm9yd2FyZHNDaGFyKGN1cnNvciwgbm9kZXNDcm9zc2VkKTtcbiAgICBpZiAoYyA9PSBudWxsKVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBTZXQgc3RhcnRDdXJzb3IgdG8gdGhlIHBvc2l0aW9uIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZmlyc3RcbiAgLy8gY2hhcmFjdGVyIGluIG91ciB3b3JkLiBJdCdzIHNhZmUgdG8gZGVjcmVtZW50IHxpbmRleHwgYmVjYXVzZVxuICAvLyBmb3J3YXJkc0NoYXIgZ3VhcmFudGVlcyB0aGF0IHRoZSBjdXJzb3Igd2lsbCBiZSBpbW1lZGlhdGVseSB0byB0aGVcbiAgLy8gcmlnaHQgb2YgdGhlIHJldHVybmVkIGNoYXJhY3RlciBvbiBleGl0LlxuICBzdGFydEN1cnNvci5jb3B5RnJvbShjdXJzb3IpO1xuICBzdGFydEN1cnNvci5pbmRleC0tO1xuXG4gIC8vIEtlZXAgYnVpbGRpbmcgdXAgb3VyIHdvcmQgdW50aWwgd2UgcmVhY2ggYSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBvclxuICAvLyB3b3VsZCBjcm9zcyBhIHRhZy4gIERvbid0IGFjdHVhbGx5IHJldHVybiBhbnkgdGFncyBjcm9zc2VkLCBiZWNhdXNlIHRoaXNcbiAgLy8gd29yZCBnb2VzIHVwIHVudGlsIHRoZSB0YWcgYm91bmRhcnkgYnV0IG5vdCBwYXN0IGl0LlxuICBlbmRDdXJzb3IuY29weUZyb20oY3Vyc29yKTtcbiAgdmFyIHdvcmQgPSBjO1xuICB2YXIgbmV3Tm9kZXNDcm9zc2VkID0gW107XG4gIGMgPSBUcmF2ZXJzZVV0aWwuZm9yd2FyZHNDaGFyKGN1cnNvciwgbmV3Tm9kZXNDcm9zc2VkKTtcbiAgaWYgKGMgPT0gbnVsbCkge1xuICAgIHJldHVybiB3b3JkO1xuICB9XG4gIHdoaWxlICghVHJhdmVyc2VVdGlsLmlzV2hpdGVzcGFjZShjKSAmJlxuICAgICBuZXdOb2Rlc0Nyb3NzZWQubGVuZ3RoID09IDApIHtcbiAgICB3b3JkICs9IGM7XG4gICAgZW5kQ3Vyc29yLmNvcHlGcm9tKGN1cnNvcik7XG4gICAgYyA9IFRyYXZlcnNlVXRpbC5mb3J3YXJkc0NoYXIoY3Vyc29yLCBuZXdOb2Rlc0Nyb3NzZWQpO1xuICAgIGlmIChjID09IG51bGwpIHtcbiAgICAgIHJldHVybiB3b3JkO1xuICAgIH1cbiAgfVxuICByZXR1cm4gd29yZDtcbn07XG5cbi8qKlxuICogRmluZHMgdGhlIHByZXZpb3VzIHdvcmQsIHN0YXJ0aW5nIGZyb20gc3RhcnRDdXJzb3IuICBVcG9uIGV4aXQsIHN0YXJ0Q3Vyc29yXG4gKiBhbmQgZW5kQ3Vyc29yIHdpbGwgc3Vycm91bmQgdGhlIHByZXZpb3VzIHdvcmQuICBBIHdvcmQgaXMgZGVmaW5lZCB0byBiZVxuICogYSBzdHJpbmcgb2YgMSBvciBtb3JlIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW4gdGhlIHNhbWUgRE9NIG5vZGUuXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnRDdXJzb3IgVGhlIHBvc2l0aW9uIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgdGhlXG4gKiAgICAgcHJldmlvdXMgd29yZC4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIGJlZ2lubmluZyBvZiB0aGVcbiAqICAgICB3b3JkIHJldHVybmVkLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBlbmQgb2YgdGhlXG4gKiAgICAgd29yZCByZXR1cm5lZC5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBwcmV2aW91cyB3b3JkLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmdldFByZXZpb3VzV29yZCA9IGZ1bmN0aW9uKHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsXG4gICAgbm9kZXNDcm9zc2VkKSB7XG4gIC8vIEZpbmQgdGhlIGZpcnN0IG5vbi13aGl0ZXNwYWNlIG9yIG5vbi1za2lwcGVkIGNoYXJhY3Rlci5cbiAgdmFyIGN1cnNvciA9IHN0YXJ0Q3Vyc29yLmNsb25lKCk7XG4gIHZhciBjID0gVHJhdmVyc2VVdGlsLmJhY2t3YXJkc0NoYXIoY3Vyc29yLCBub2Rlc0Nyb3NzZWQpO1xuICBpZiAoYyA9PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICB3aGlsZSAoKFRyYXZlcnNlVXRpbC5pc1doaXRlc3BhY2UoYykgfHxcbiAgICAgIChUcmF2ZXJzZVV0aWwuaXNTa2lwcGVkKGN1cnNvci5ub2RlKSkpKSB7XG4gICAgYyA9IFRyYXZlcnNlVXRpbC5iYWNrd2FyZHNDaGFyKGN1cnNvciwgbm9kZXNDcm9zc2VkKTtcbiAgICBpZiAoYyA9PSBudWxsKVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvLyBTZXQgZW5kQ3Vyc29yIHRvIHRoZSBwb3NpdGlvbiBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3RcbiAgLy8gY2hhcmFjdGVyIHdlJ3ZlIGZvdW5kICh0aGUgbGFzdCBjaGFyYWN0ZXIgb2YgdGhlIHdvcmQsIHNpbmNlIHdlJ3JlXG4gIC8vIHNlYXJjaGluZyBiYWNrd2FyZHMpLlxuICBlbmRDdXJzb3IuY29weUZyb20oY3Vyc29yKTtcbiAgZW5kQ3Vyc29yLmluZGV4Kys7XG5cbiAgLy8gS2VlcCBidWlsZGluZyB1cCBvdXIgd29yZCB1bnRpbCB3ZSByZWFjaCBhIHdoaXRlc3BhY2UgY2hhcmFjdGVyIG9yXG4gIC8vIHdvdWxkIGNyb3NzIGEgdGFnLiAgRG9uJ3QgYWN0dWFsbHkgcmV0dXJuIGFueSB0YWdzIGNyb3NzZWQsIGJlY2F1c2UgdGhpc1xuICAvLyB3b3JkIGdvZXMgdXAgdW50aWwgdGhlIHRhZyBib3VuZGFyeSBidXQgbm90IHBhc3QgaXQuXG4gIHN0YXJ0Q3Vyc29yLmNvcHlGcm9tKGN1cnNvcik7XG4gIHZhciB3b3JkID0gYztcbiAgdmFyIG5ld05vZGVzQ3Jvc3NlZCA9IFtdO1xuICBjID0gVHJhdmVyc2VVdGlsLmJhY2t3YXJkc0NoYXIoY3Vyc29yLCBuZXdOb2Rlc0Nyb3NzZWQpO1xuICBpZiAoYyA9PSBudWxsKVxuICAgIHJldHVybiB3b3JkO1xuICB3aGlsZSAoIVRyYXZlcnNlVXRpbC5pc1doaXRlc3BhY2UoYykgJiZcbiAgICAgIG5ld05vZGVzQ3Jvc3NlZC5sZW5ndGggPT0gMCkge1xuICAgIHdvcmQgPSBjICsgd29yZDtcbiAgICBzdGFydEN1cnNvci5jb3B5RnJvbShjdXJzb3IpO1xuICAgIGMgPSBUcmF2ZXJzZVV0aWwuYmFja3dhcmRzQ2hhcihjdXJzb3IsIG5ld05vZGVzQ3Jvc3NlZCk7XG4gICAgaWYgKGMgPT0gbnVsbClcbiAgICAgIHJldHVybiB3b3JkO1xuICB9XG5cbiAgcmV0dXJuIHdvcmQ7XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSBuZXh0IHNlbnRlbmNlLCBzdGFydGluZyBmcm9tIGVuZEN1cnNvci4gIFVwb24gZXhpdCxcbiAqIHN0YXJ0Q3Vyc29yIGFuZCBlbmRDdXJzb3Igd2lsbCBzdXJyb3VuZCB0aGUgbmV4dCBzZW50ZW5jZS5cbiAqXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnRDdXJzb3IgT24gZXhpdCwgbWFya3MgdGhlIGJlZ2lubmluZyBvZiB0aGUgc2VudGVuY2UuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIFRoZSBwb3NpdGlvbiB0byBzdGFydCBzZWFyY2hpbmcgZm9yIHRoZSBuZXh0XG4gKiAgICAgc2VudGVuY2UuICBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBlbmQgb2YgdGhlIHJldHVybmVkIHN0cmluZy5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBicmVha1RhZ3MgQXNzb2NpYXRpdmUgYXJyYXkgb2YgdGFncyB0aGF0IHNob3VsZCBicmVha1xuICogICAgIHRoZSBzZW50ZW5jZS5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuZXh0IHNlbnRlbmNlLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmdldE5leHRTZW50ZW5jZSA9IGZ1bmN0aW9uKFxuICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCwgYnJlYWtUYWdzKSB7XG4gIHJldHVybiBUcmF2ZXJzZVV0aWwuZ2V0TmV4dFN0cmluZyhcbiAgICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCxcbiAgICAgIGZ1bmN0aW9uKHN0ciwgd29yZCwgbm9kZXMpIHtcbiAgICAgICAgaWYgKHN0ci5zdWJzdHIoLTEpID09ICcuJylcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChUcmF2ZXJzZVV0aWwuaXNTa2lwcGVkKG5vZGVzW2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGVzW2ldLCBudWxsKTtcbiAgICAgICAgICBpZiAoc3R5bGUgJiYgKHN0eWxlLmRpc3BsYXkgIT0gJ2lubGluZScgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrVGFnc1tub2Rlc1tpXS50YWdOYW1lXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbn07XG5cbi8qKlxuICogRmluZHMgdGhlIHByZXZpb3VzIHNlbnRlbmNlLCBzdGFydGluZyBmcm9tIHN0YXJ0Q3Vyc29yLiAgVXBvbiBleGl0LFxuICogc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciB3aWxsIHN1cnJvdW5kIHRoZSBwcmV2aW91cyBzZW50ZW5jZS5cbiAqXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnRDdXJzb3IgVGhlIHBvc2l0aW9uIHRvIHN0YXJ0IHNlYXJjaGluZyBmb3IgdGhlIG5leHRcbiAqICAgICBzZW50ZW5jZS4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZXR1cm5lZCBzdHJpbmcuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIE9uIGV4aXQsIHRoZSBlbmQgb2YgdGhlIHJldHVybmVkIHN0cmluZy5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBicmVha1RhZ3MgQXNzb2NpYXRpdmUgYXJyYXkgb2YgdGFncyB0aGF0IHNob3VsZCBicmVha1xuICogICAgIHRoZSBzZW50ZW5jZS5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBwcmV2aW91cyBzZW50ZW5jZSwgb3IgbnVsbCBpZiB0aGUgYm90dG9tIG9mIHRoZVxuICogICAgIGRvY3VtZW50IGhhcyBiZWVuIHJlYWNoZWQuXG4gKi9cblRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c1NlbnRlbmNlID0gZnVuY3Rpb24oXG4gICAgc3RhcnRDdXJzb3IsIGVuZEN1cnNvciwgbm9kZXNDcm9zc2VkLCBicmVha1RhZ3MpIHtcbiAgcmV0dXJuIFRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c1N0cmluZyhcbiAgICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCxcbiAgICAgIGZ1bmN0aW9uKHN0ciwgd29yZCwgbm9kZXMpIHtcbiAgICAgICAgaWYgKHdvcmQuc3Vic3RyKC0xKSA9PSAnLicpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2Rlc1tpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2Rlc1tpXSwgbnVsbCk7XG4gICAgICAgICAgaWYgKHN0eWxlICYmIChzdHlsZS5kaXNwbGF5ICE9ICdpbmxpbmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1RhZ3Nbbm9kZXNbaV0udGFnTmFtZV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSBuZXh0IGxpbmUsIHN0YXJ0aW5nIGZyb20gZW5kQ3Vyc29yLiAgVXBvbiBleGl0LFxuICogc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciB3aWxsIHN1cnJvdW5kIHRoZSBuZXh0IGxpbmUuXG4gKlxuICogQHBhcmFtIHtDdXJzb3J9IHN0YXJ0Q3Vyc29yIE9uIGV4aXQsIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpbmUuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIFRoZSBwb3NpdGlvbiB0byBzdGFydCBzZWFyY2hpbmcgZm9yIHRoZSBuZXh0XG4gKiAgICAgbGluZS4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIGVuZCBvZiB0aGUgcmV0dXJuZWQgc3RyaW5nLlxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNDcm9zc2VkIEFueSBIVE1MIG5vZGVzIGNyb3NzZWQgYmV0d2VlbiB0aGVcbiAqICAgICBpbml0aWFsIGFuZCBmaW5hbCBjdXJzb3IgcG9zaXRpb24gd2lsbCBiZSBwdXNoZWQgb250byB0aGlzIGFycmF5LlxuICogQHBhcmFtIHtudW1iZXJ9IGxpbmVMZW5ndGggVGhlIG1heGltdW0gbnVtYmVyIG9mIGNoYXJhY3RlcnMgaW4gYSBsaW5lLlxuICogQHBhcmFtIHtPYmplY3R9IGJyZWFrVGFncyBBc3NvY2lhdGl2ZSBhcnJheSBvZiB0YWdzIHRoYXQgc2hvdWxkIGJyZWFrXG4gKiAgICAgdGhlIGxpbmUuXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmV4dCBsaW5lLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmdldE5leHRMaW5lID0gZnVuY3Rpb24oXG4gICAgc3RhcnRDdXJzb3IsIGVuZEN1cnNvciwgbm9kZXNDcm9zc2VkLCBsaW5lTGVuZ3RoLCBicmVha1RhZ3MpIHtcbiAgcmV0dXJuIFRyYXZlcnNlVXRpbC5nZXROZXh0U3RyaW5nKFxuICAgICAgc3RhcnRDdXJzb3IsIGVuZEN1cnNvciwgbm9kZXNDcm9zc2VkLFxuICAgICAgZnVuY3Rpb24oc3RyLCB3b3JkLCBub2Rlcykge1xuICAgICAgICBpZiAoc3RyLmxlbmd0aCArIHdvcmQubGVuZ3RoICsgMSA+IGxpbmVMZW5ndGgpXG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2Rlc1tpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2Rlc1tpXSwgbnVsbCk7XG4gICAgICAgICAgaWYgKHN0eWxlICYmIChzdHlsZS5kaXNwbGF5ICE9ICdpbmxpbmUnIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVha1RhZ3Nbbm9kZXNbaV0udGFnTmFtZV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG59O1xuXG4vKipcbiAqIEZpbmRzIHRoZSBwcmV2aW91cyBsaW5lLCBzdGFydGluZyBmcm9tIHN0YXJ0Q3Vyc29yLiAgVXBvbiBleGl0LFxuICogc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciB3aWxsIHN1cnJvdW5kIHRoZSBwcmV2aW91cyBsaW5lLlxuICpcbiAqIEBwYXJhbSB7Q3Vyc29yfSBzdGFydEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgbmV4dFxuICogICAgIGxpbmUuICBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBzdGFydCBvZiB0aGUgcmV0dXJuZWQgc3RyaW5nLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBPbiBleGl0LCB0aGUgZW5kIG9mIHRoZSByZXR1cm5lZCBzdHJpbmcuXG4gKiBAcGFyYW0ge0FycmF5PE5vZGU+fSBub2Rlc0Nyb3NzZWQgQW55IEhUTUwgbm9kZXMgY3Jvc3NlZCBiZXR3ZWVuIHRoZVxuICogICAgIGluaXRpYWwgYW5kIGZpbmFsIGN1cnNvciBwb3NpdGlvbiB3aWxsIGJlIHB1c2hlZCBvbnRvIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0ge251bWJlcn0gbGluZUxlbmd0aCBUaGUgbWF4aW11bSBudW1iZXIgb2YgY2hhcmFjdGVycyBpbiBhIGxpbmUuXG4gKiBAcGFyYW0ge09iamVjdH0gYnJlYWtUYWdzIEFzc29jaWF0aXZlIGFycmF5IG9mIHRhZ3MgdGhhdCBzaG91bGQgYnJlYWtcbiAqICAgICB0aGUgc2VudGVuY2UuXG4gKiAgQHJldHVybiB7P3N0cmluZ30gVGhlIHByZXZpb3VzIGxpbmUsIG9yIG51bGwgaWYgdGhlIGJvdHRvbSBvZiB0aGVcbiAqICAgICBkb2N1bWVudCBoYXMgYmVlbiByZWFjaGVkLlxuICovXG5UcmF2ZXJzZVV0aWwuZ2V0UHJldmlvdXNMaW5lID0gZnVuY3Rpb24oXG4gICAgc3RhcnRDdXJzb3IsIGVuZEN1cnNvciwgbm9kZXNDcm9zc2VkLCBsaW5lTGVuZ3RoLCBicmVha1RhZ3MpIHtcbiAgcmV0dXJuIFRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c1N0cmluZyhcbiAgICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCxcbiAgICAgIGZ1bmN0aW9uKHN0ciwgd29yZCwgbm9kZXMpIHtcbiAgICAgICAgaWYgKHN0ci5sZW5ndGggKyB3b3JkLmxlbmd0aCArIDEgPiBsaW5lTGVuZ3RoKVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKFRyYXZlcnNlVXRpbC5pc1NraXBwZWQobm9kZXNbaV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUobm9kZXNbaV0sIG51bGwpO1xuICAgICAgICAgIGlmIChzdHlsZSAmJiAoc3R5bGUuZGlzcGxheSAhPSAnaW5saW5lJyB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWtUYWdzW25vZGVzW2ldLnRhZ05hbWVdKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xufTtcblxuLyoqXG4gKiBGaW5kcyB0aGUgbmV4dCBwYXJhZ3JhcGgsIHN0YXJ0aW5nIGZyb20gZW5kQ3Vyc29yLiAgVXBvbiBleGl0LFxuICogc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciB3aWxsIHN1cnJvdW5kIHRoZSBuZXh0IHBhcmFncmFwaC5cbiAqXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnRDdXJzb3IgT24gZXhpdCwgbWFya3MgdGhlIGJlZ2lubmluZyBvZiB0aGUgcGFyYWdyYXBoLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgbmV4dFxuICogICAgIHBhcmFncmFwaC4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIGVuZCBvZiB0aGUgcmV0dXJuZWQgc3RyaW5nLlxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNDcm9zc2VkIEFueSBIVE1MIG5vZGVzIGNyb3NzZWQgYmV0d2VlbiB0aGVcbiAqICAgICBpbml0aWFsIGFuZCBmaW5hbCBjdXJzb3IgcG9zaXRpb24gd2lsbCBiZSBwdXNoZWQgb250byB0aGlzIGFycmF5LlxuICogQHJldHVybiB7P3N0cmluZ30gVGhlIG5leHQgcGFyYWdyYXBoLCBvciBudWxsIGlmIHRoZSBib3R0b20gb2YgdGhlXG4gKiAgICAgZG9jdW1lbnQgaGFzIGJlZW4gcmVhY2hlZC5cbiAqL1xuVHJhdmVyc2VVdGlsLmdldE5leHRQYXJhZ3JhcGggPSBmdW5jdGlvbihzdGFydEN1cnNvciwgZW5kQ3Vyc29yLFxuICAgIG5vZGVzQ3Jvc3NlZCkge1xuICByZXR1cm4gVHJhdmVyc2VVdGlsLmdldE5leHRTdHJpbmcoXG4gICAgICBzdGFydEN1cnNvciwgZW5kQ3Vyc29yLCBub2Rlc0Nyb3NzZWQsXG4gICAgICBmdW5jdGlvbihzdHIsIHdvcmQsIG5vZGVzKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoVHJhdmVyc2VVdGlsLmlzU2tpcHBlZChub2Rlc1tpXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShub2Rlc1tpXSwgbnVsbCk7XG4gICAgICAgICAgaWYgKHN0eWxlICYmIHN0eWxlLmRpc3BsYXkgIT0gJ2lubGluZScpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9KTtcbn07XG5cbi8qKlxuICogRmluZHMgdGhlIHByZXZpb3VzIHBhcmFncmFwaCwgc3RhcnRpbmcgZnJvbSBzdGFydEN1cnNvci4gIFVwb24gZXhpdCxcbiAqIHN0YXJ0Q3Vyc29yIGFuZCBlbmRDdXJzb3Igd2lsbCBzdXJyb3VuZCB0aGUgcHJldmlvdXMgcGFyYWdyYXBoLlxuICpcbiAqIEBwYXJhbSB7Q3Vyc29yfSBzdGFydEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgbmV4dFxuICogICAgIHBhcmFncmFwaC4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIHN0YXJ0IG9mIHRoZSByZXR1cm5lZCBzdHJpbmcuXG4gKiBAcGFyYW0ge0N1cnNvcn0gZW5kQ3Vyc29yIE9uIGV4aXQsIHRoZSBlbmQgb2YgdGhlIHJldHVybmVkIHN0cmluZy5cbiAqIEBwYXJhbSB7QXJyYXk8Tm9kZT59IG5vZGVzQ3Jvc3NlZCBBbnkgSFRNTCBub2RlcyBjcm9zc2VkIGJldHdlZW4gdGhlXG4gKiAgICAgaW5pdGlhbCBhbmQgZmluYWwgY3Vyc29yIHBvc2l0aW9uIHdpbGwgYmUgcHVzaGVkIG9udG8gdGhpcyBhcnJheS5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBwcmV2aW91cyBwYXJhZ3JhcGgsIG9yIG51bGwgaWYgdGhlIGJvdHRvbSBvZiB0aGVcbiAqICAgICBkb2N1bWVudCBoYXMgYmVlbiByZWFjaGVkLlxuICovXG5UcmF2ZXJzZVV0aWwuZ2V0UHJldmlvdXNQYXJhZ3JhcGggPSBmdW5jdGlvbihcbiAgICBzdGFydEN1cnNvciwgZW5kQ3Vyc29yLCBub2Rlc0Nyb3NzZWQpIHtcbiAgcmV0dXJuIFRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c1N0cmluZyhcbiAgICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCxcbiAgICAgIGZ1bmN0aW9uKHN0ciwgd29yZCwgbm9kZXMpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChUcmF2ZXJzZVV0aWwuaXNTa2lwcGVkKG5vZGVzW2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKG5vZGVzW2ldLCBudWxsKTtcbiAgICAgICAgICBpZiAoc3R5bGUgJiYgc3R5bGUuZGlzcGxheSAhPSAnaW5saW5lJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH0pO1xufTtcblxuLyoqXG4gKiBDdXN0b21pemFibGUgZnVuY3Rpb24gdG8gcmV0dXJuIHRoZSBuZXh0IHN0cmluZyBvZiB3b3JkcyBpbiB0aGUgRE9NLCBiYXNlZFxuICogb24gcHJvdmlkZWQgZnVuY3Rpb25zIHRvIGRlY2lkZSB3aGVuIHRvIGJyZWFrIG9uZSBzdHJpbmcgYW5kIHN0YXJ0XG4gKiB0aGUgbmV4dC4gVGhpcyBjYW4gYmUgdXNlZCB0byBnZXQgdGhlIG5leHQgc2VudGVuY2UsIGxpbmUsIHBhcmFncmFwaCxcbiAqIG9yIHBvdGVudGlhbGx5IG90aGVyIGdyYW51bGFyaXRpZXMuXG4gKlxuICogRmluZHMgdGhlIG5leHQgY29udGlndW91cyBzdHJpbmcsIHN0YXJ0aW5nIGZyb20gZW5kQ3Vyc29yLiAgVXBvbiBleGl0LFxuICogc3RhcnRDdXJzb3IgYW5kIGVuZEN1cnNvciB3aWxsIHN1cnJvdW5kIHRoZSBuZXh0IHN0cmluZy5cbiAqXG4gKiBUaGUgYnJlYWtCZWZvcmUgZnVuY3Rpb24gdGFrZXMgdGhyZWUgcGFyYW1ldGVycywgYW5kXG4gKiBzaG91bGQgcmV0dXJuIHRydWUgaWYgdGhlIHN0cmluZyBzaG91bGQgYmUgYnJva2VuIGJlZm9yZSB0aGUgcHJvcG9zZWRcbiAqIG5leHQgd29yZDpcbiAqICAgc3RyIFRoZSBzdHJpbmcgc28gZmFyLlxuICogICB3b3JkIFRoZSBuZXh0IHdvcmQgdG8gYmUgYWRkZWQuXG4gKiAgIG5vZGVzQ3Jvc3NlZCBUaGUgbm9kZXMgY3Jvc3NlZCBpbiByZWFjaGluZyB0aGlzIG5leHQgd29yZC5cbiAqXG4gKiBAcGFyYW0ge0N1cnNvcn0gc3RhcnRDdXJzb3IgT24gZXhpdCwgd2lsbCBwb2ludCB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZVxuICogICAgIG5leHQgc3RyaW5nLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGUgbmV4dFxuICogICAgIHN0cmluZy4gIE9uIGV4aXQsIHdpbGwgcG9pbnQgdG8gdGhlIGVuZCBvZiB0aGUgcmV0dXJuZWQgc3RyaW5nLlxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNDcm9zc2VkIEFueSBIVE1MIG5vZGVzIGNyb3NzZWQgYmV0d2VlbiB0aGVcbiAqICAgICBpbml0aWFsIGFuZCBmaW5hbCBjdXJzb3IgcG9zaXRpb24gd2lsbCBiZSBwdXNoZWQgb250byB0aGlzIGFycmF5LlxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIHN0cmluZywgQXJyYXk8c3RyaW5nPil9IGJyZWFrQmVmb3JlXG4gKiAgICAgRnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgc3RyaW5nIHNvIGZhciwgbmV4dCB3b3JkIHRvIGJlIGFkZGVkLCBhbmRcbiAqICAgICBub2RlcyBjcm9zc2VkLCBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBzdHJpbmcgc2hvdWxkIGJlIGVuZGVkIGJlZm9yZVxuICogICAgIGFkZGluZyB0aGlzIHdvcmQuXG4gKiBAcmV0dXJuIHs/c3RyaW5nfSBUaGUgbmV4dCBzdHJpbmcsIG9yIG51bGwgaWYgdGhlIGJvdHRvbSBvZiB0aGVcbiAqICAgICBkb2N1bWVudCBoYXMgYmVlbiByZWFjaGVkLlxuICovXG5UcmF2ZXJzZVV0aWwuZ2V0TmV4dFN0cmluZyA9IGZ1bmN0aW9uKFxuICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCwgYnJlYWtCZWZvcmUpIHtcbiAgLy8gR2V0IHRoZSBmaXJzdCB3b3JkIGFuZCBzZXQgdGhlIHN0YXJ0IGN1cnNvciB0byB0aGUgc3RhcnQgb2YgdGhlXG4gIC8vIGZpcnN0IHdvcmQuXG4gIHZhciB3b3JkU3RhcnRDdXJzb3IgPSBlbmRDdXJzb3IuY2xvbmUoKTtcbiAgdmFyIHdvcmRFbmRDdXJzb3IgPSBlbmRDdXJzb3IuY2xvbmUoKTtcbiAgdmFyIG5ld05vZGVzQ3Jvc3NlZCA9IFtdO1xuICB2YXIgc3RyID0gJyc7XG4gIHZhciB3b3JkID0gVHJhdmVyc2VVdGlsLmdldE5leHRXb3JkKFxuICAgICAgd29yZFN0YXJ0Q3Vyc29yLCB3b3JkRW5kQ3Vyc29yLCBuZXdOb2Rlc0Nyb3NzZWQpO1xuICBpZiAod29yZCA9PSBudWxsKVxuICAgIHJldHVybiBudWxsO1xuICBzdGFydEN1cnNvci5jb3B5RnJvbSh3b3JkU3RhcnRDdXJzb3IpO1xuXG4gIC8vIEFsd2F5cyBhZGQgdGhlIGZpcnN0IHdvcmQgd2hlbiB0aGUgc3RyaW5nIGlzIGVtcHR5LCBhbmQgdGhlbiBrZWVwXG4gIC8vIGFkZGluZyBtb3JlIHdvcmRzIGFzIGxvbmcgYXMgYnJlYWtCZWZvcmUgcmV0dXJucyBmYWxzZVxuICB3aGlsZSAoIXN0ciB8fCAhYnJlYWtCZWZvcmUoc3RyLCB3b3JkLCBuZXdOb2Rlc0Nyb3NzZWQpKSB7XG4gICAgLy8gQXBwZW5kIHRoaXMgd29yZCwgc2V0IHRoZSBlbmQgY3Vyc29yIHRvIHRoZSBlbmQgb2YgdGhpcyB3b3JkLCBhbmRcbiAgICAvLyB1cGRhdGUgdGhlIHJldHVybmVkIGxpc3Qgb2Ygbm9kZXMgY3Jvc3NlZCB0byBpbmNsdWRlIG9uZXMgd2UgY3Jvc3NlZFxuICAgIC8vIGluIHJlYWNoaW5nIHRoaXMgd29yZC5cbiAgICBpZiAoc3RyKVxuICAgICAgc3RyICs9ICcgJztcbiAgICBzdHIgKz0gd29yZDtcbiAgICBub2Rlc0Nyb3NzZWQgPSBub2Rlc0Nyb3NzZWQuY29uY2F0KG5ld05vZGVzQ3Jvc3NlZCk7XG4gICAgZW5kQ3Vyc29yLmNvcHlGcm9tKHdvcmRFbmRDdXJzb3IpO1xuXG4gICAgLy8gR2V0IHRoZSBuZXh0IHdvcmQgYW5kIGdvIGJhY2sgdG8gdGhlIHRvcCBvZiB0aGUgbG9vcC5cbiAgICBuZXdOb2Rlc0Nyb3NzZWQgPSBbXTtcbiAgICB3b3JkID0gVHJhdmVyc2VVdGlsLmdldE5leHRXb3JkKFxuICAgICAgICB3b3JkU3RhcnRDdXJzb3IsIHdvcmRFbmRDdXJzb3IsIG5ld05vZGVzQ3Jvc3NlZCk7XG4gICAgaWYgKHdvcmQgPT0gbnVsbClcbiAgICAgIHJldHVybiBzdHI7XG4gIH1cblxuICByZXR1cm4gc3RyO1xufTtcblxuLyoqXG4gKiBDdXN0b21pemFibGUgZnVuY3Rpb24gdG8gcmV0dXJuIHRoZSBwcmV2aW91cyBzdHJpbmcgb2Ygd29yZHMgaW4gdGhlIERPTSxcbiAqIGJhc2VkIG9uIHByb3ZpZGVkIGZ1bmN0aW9ucyB0byBkZWNpZGUgd2hlbiB0byBicmVhayBvbmUgc3RyaW5nIGFuZCBzdGFydFxuICogdGhlIG5leHQuIFNlZSBnZXROZXh0U3RyaW5nLCBhYm92ZSwgZm9yIG1vcmUgZGV0YWlscy5cbiAqXG4gKiBGaW5kcyB0aGUgcHJldmlvdXMgY29udGlndW91cyBzdHJpbmcsIHN0YXJ0aW5nIGZyb20gc3RhcnRDdXJzb3IuICBVcG9uIGV4aXQsXG4gKiBzdGFydEN1cnNvciBhbmQgZW5kQ3Vyc29yIHdpbGwgc3Vycm91bmQgdGhlIG5leHQgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7Q3Vyc29yfSBzdGFydEN1cnNvciBUaGUgcG9zaXRpb24gdG8gc3RhcnQgc2VhcmNoaW5nIGZvciB0aGVcbiAqICAgICBwcmV2aW91cyBzdHJpbmcuICBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlXG4gKiAgICAgc3RyaW5nIHJldHVybmVkLlxuICogQHBhcmFtIHtDdXJzb3J9IGVuZEN1cnNvciBPbiBleGl0LCB3aWxsIHBvaW50IHRvIHRoZSBlbmQgb2YgdGhlXG4gKiAgICAgc3RyaW5nIHJldHVybmVkLlxuICogQHBhcmFtIHtBcnJheTxOb2RlPn0gbm9kZXNDcm9zc2VkIEFueSBIVE1MIG5vZGVzIGNyb3NzZWQgYmV0d2VlbiB0aGVcbiAqICAgICBpbml0aWFsIGFuZCBmaW5hbCBjdXJzb3IgcG9zaXRpb24gd2lsbCBiZSBwdXNoZWQgb250byB0aGlzIGFycmF5LlxuICogQHBhcmFtIHtmdW5jdGlvbihzdHJpbmcsIHN0cmluZywgQXJyYXk8c3RyaW5nPil9IGJyZWFrQmVmb3JlXG4gKiAgICAgRnVuY3Rpb24gdGhhdCB0YWtlcyB0aGUgc3RyaW5nIHNvIGZhciwgdGhlIHdvcmQgdG8gYmUgYWRkZWQsIGFuZFxuICogICAgIG5vZGVzIGNyb3NzZWQsIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHN0cmluZyBzaG91bGQgYmUgZW5kZWQgYmVmb3JlXG4gKiAgICAgYWRkaW5nIHRoaXMgd29yZC5cbiAqIEByZXR1cm4gez9zdHJpbmd9IFRoZSBuZXh0IHN0cmluZywgb3IgbnVsbCBpZiB0aGUgdG9wIG9mIHRoZVxuICogICAgIGRvY3VtZW50IGhhcyBiZWVuIHJlYWNoZWQuXG4gKi9cblRyYXZlcnNlVXRpbC5nZXRQcmV2aW91c1N0cmluZyA9IGZ1bmN0aW9uKFxuICAgIHN0YXJ0Q3Vyc29yLCBlbmRDdXJzb3IsIG5vZGVzQ3Jvc3NlZCwgYnJlYWtCZWZvcmUpIHtcbiAgLy8gR2V0IHRoZSBmaXJzdCB3b3JkIGFuZCBzZXQgdGhlIGVuZCBjdXJzb3IgdG8gdGhlIGVuZCBvZiB0aGVcbiAgLy8gZmlyc3Qgd29yZC5cbiAgdmFyIHdvcmRTdGFydEN1cnNvciA9IHN0YXJ0Q3Vyc29yLmNsb25lKCk7XG4gIHZhciB3b3JkRW5kQ3Vyc29yID0gc3RhcnRDdXJzb3IuY2xvbmUoKTtcbiAgdmFyIG5ld05vZGVzQ3Jvc3NlZCA9IFtdO1xuICB2YXIgc3RyID0gJyc7XG4gIHZhciB3b3JkID0gVHJhdmVyc2VVdGlsLmdldFByZXZpb3VzV29yZChcbiAgICAgIHdvcmRTdGFydEN1cnNvciwgd29yZEVuZEN1cnNvciwgbmV3Tm9kZXNDcm9zc2VkKTtcbiAgaWYgKHdvcmQgPT0gbnVsbClcbiAgICByZXR1cm4gbnVsbDtcbiAgZW5kQ3Vyc29yLmNvcHlGcm9tKHdvcmRFbmRDdXJzb3IpO1xuXG4gIC8vIEFsd2F5cyBhZGQgdGhlIGZpcnN0IHdvcmQgd2hlbiB0aGUgc3RyaW5nIGlzIGVtcHR5LCBhbmQgdGhlbiBrZWVwXG4gIC8vIGFkZGluZyBtb3JlIHdvcmRzIGFzIGxvbmcgYXMgYnJlYWtCZWZvcmUgcmV0dXJucyBmYWxzZVxuICB3aGlsZSAoIXN0ciB8fCAhYnJlYWtCZWZvcmUoc3RyLCB3b3JkLCBuZXdOb2Rlc0Nyb3NzZWQpKSB7XG4gICAgLy8gUHJlcGVuZCB0aGlzIHdvcmQsIHNldCB0aGUgc3RhcnQgY3Vyc29yIHRvIHRoZSBzdGFydCBvZiB0aGlzIHdvcmQsIGFuZFxuICAgIC8vIHVwZGF0ZSB0aGUgcmV0dXJuZWQgbGlzdCBvZiBub2RlcyBjcm9zc2VkIHRvIGluY2x1ZGUgb25lcyB3ZSBjcm9zc2VkXG4gICAgLy8gaW4gcmVhY2hpbmcgdGhpcyB3b3JkLlxuICAgIGlmIChzdHIpXG4gICAgICBzdHIgPSAnICcgKyBzdHI7XG4gICAgc3RyID0gd29yZCArIHN0cjtcbiAgICBub2Rlc0Nyb3NzZWQgPSBub2Rlc0Nyb3NzZWQuY29uY2F0KG5ld05vZGVzQ3Jvc3NlZCk7XG4gICAgc3RhcnRDdXJzb3IuY29weUZyb20od29yZFN0YXJ0Q3Vyc29yKTtcbiAgICAvLyBHZXQgdGhlIHByZXZpb3VzIHdvcmQgYW5kIGdvIGJhY2sgdG8gdGhlIHRvcCBvZiB0aGUgbG9vcC5cbiAgICBuZXdOb2Rlc0Nyb3NzZWQgPSBbXTtcbiAgICB3b3JkID0gVHJhdmVyc2VVdGlsLmdldFByZXZpb3VzV29yZChcbiAgICAgICAgd29yZFN0YXJ0Q3Vyc29yLCB3b3JkRW5kQ3Vyc29yLCBuZXdOb2Rlc0Nyb3NzZWQpO1xuICAgIGlmICh3b3JkID09IG51bGwpXG4gICAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgcmV0dXJuIHN0cjtcbn07XG5cbm1vZHVsZS5leHBvcnRzLkN1cnNvciA9IEN1cnNvcjtcbm1vZHVsZS5leHBvcnRzLlRyYXZlcnNlVXRpbCA9IFRyYXZlcnNlVXRpbDtcblxufSkuY2FsbCh0aGlzKTtcbiIsIihmdW5jdGlvbigpIHtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgZGVidWcsIGRlZmF1bHRzLCBmcmVlemUsIGlzYSwgbG9nLCByZWYsIHR5cGVzLCB2YWxpZGF0ZSwgdmFsaWRhdGVfb3B0aW9uYWwsIMK1LFxuICAgIGJvdW5kTWV0aG9kQ2hlY2sgPSBmdW5jdGlvbihpbnN0YW5jZSwgQ29uc3RydWN0b3IpIHsgaWYgKCEoaW5zdGFuY2UgaW5zdGFuY2VvZiBDb25zdHJ1Y3RvcikpIHsgdGhyb3cgbmV3IEVycm9yKCdCb3VuZCBpbnN0YW5jZSBtZXRob2QgYWNjZXNzZWQgYmVmb3JlIGJpbmRpbmcnKTsgfSB9O1xuXG4gIMK1ID0gcmVxdWlyZSgnLi9tYWluJyk7XG5cbiAgbG9nID0gY29uc29sZS5sb2c7XG5cbiAgZGVidWcgPSBjb25zb2xlLmRlYnVnO1xuXG4gIGZyZWV6ZSA9IE9iamVjdC5mcmVlemU7XG5cbiAgKHt0eXBlcywgaXNhLCB2YWxpZGF0ZSwgdmFsaWRhdGVfb3B0aW9uYWx9ID0gcmVxdWlyZSgnLi90eXBlcycpKTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGRlZmF1bHRzID0ge1xuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgbGF0Y2g6IHtcbiAgICAgIGR0OiAzNTAgLy8gdGltZSBpbiBtaWxsaXNlY29uZHMgYmV0d2VlbiBmaXJzdCBhbmQgbGFzdCBrZXkgZXZlbnQgdG8gdHJpZ2dlciBsYXRjaGluZ1xuICAgIH0sXG4gICAgXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBrYmxpa2VfZXZlbnRuYW1lczogW1xuICAgICAgLy8gIyMjIFRBSU5UIG5vdCBhbGwgb2YgdGhlc2UgZXZlbnRzIGFyZSBuZWVkZWRcbiAgICAgICdjbGljaycsXG4gICAgICAvLyAnZGJsY2xpY2snLCAjIGltcGxpZWQgLyBwcmVjZWRlZCBieSBgY2xpY2tgIGV2ZW50XG4gICAgICAvLyAnZHJhZycsICdkcmFnZW5kJywgJ2RyYWdlbnRlcicsICdkcmFnbGVhdmUnLCAnZHJhZ292ZXInLCAnZHJhZ3N0YXJ0JyxcbiAgICAgIC8vICdtb3VzZWRvd24nLCAnbW91c2VlbnRlcicsICdtb3VzZWxlYXZlJywgJ21vdXNlbW92ZScsICdtb3VzZW91dCcsICdtb3VzZW92ZXInLCAnbW91c2V1cCcsXG4gICAgICAvLyAncG9pbnRlcmNhbmNlbCcsXG4gICAgICAnd2hlZWwnLFxuICAgICAgJ3BvaW50ZXJtb3ZlJyxcbiAgICAgICdwb2ludGVyb3V0JyxcbiAgICAgICdwb2ludGVyb3ZlcidcbiAgICBdLFxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy8gJ3BvaW50ZXJkb3duJyxcbiAgICAvLyAncG9pbnRlcmVudGVyJyxcbiAgICAvLyAncG9pbnRlcmxlYXZlJyxcbiAgICAvLyAncG9pbnRlcnVwJyxcbiAgICAvLyAtLS0tLS0tLS0tLS0tIFRpZXIgQTogdWJpcXVpdG91cywgdW5lcXVpdm9jYWxcbiAgICBtb2RpZmllcl9uYW1lczogWydBbHQnLCAnQWx0R3JhcGgnLCAnQ29udHJvbCcsICdNZXRhJywgJ1NoaWZ0JywgJ0NhcHNMb2NrJ11cbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyAtLS0tLS0tLS0tLS0tIFRpZXIgQjogc3RhdHVzIGRvdWJ0ZnVsXG4gIC8vICdIeXBlcicsXG4gIC8vICdPUycsXG4gIC8vICdTdXBlcicsXG4gIC8vICdTeW1ib2wnLFxuICAvLyAtLS0tLS0tLS0tLS0tIFRpZXIgQzogcmFyZSwgbm90IG5lZWRlZCwgb3Igbm90IHNlbnNlZCBieSBKU1xuICAvLyAnRm4nLFxuICAvLyAnRm5Mb2NrJyxcbiAgLy8gJ051bUxvY2snLFxuICAvLyAnU2Nyb2xsTG9jaycsXG4gIC8vICdTeW1ib2xMb2NrJyxcbiAgdGhpcy5fS2IgPSAoZnVuY3Rpb24oKSB7XG4gICAgY2xhc3MgX0tiIHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBjb25zdHJ1Y3RvcihjZmcpIHtcbiAgICAgICAgdmFyIGksIGxlbiwgbW9kaWZpZXJfbmFtZSwgcmVmO1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICAvKiBHZXQgdGhlIGxhc3Qga25vd24ga2V5Ym9hcmQgbW9kaWZpZXIgc3RhdGUuIE5PVEUgbWF5IGJlIGV4dGVuZGVkIHdpdGggYGV2ZW50YCBhcmd1bWVudCBJVEYuICovXG4gICAgICAgIC8vIMK1LkRPTS5nZXRfa2JfbW9kaWZpZXJfc3RhdGUgPSAoKSA9PiByZXR1cm4geyAuLi5wcnYsIH1cblxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICB0aGlzLmdldF9jaGFuZ2VkX2tiX21vZGlmaWVyX3N0YXRlID0gdGhpcy5nZXRfY2hhbmdlZF9rYl9tb2RpZmllcl9zdGF0ZS5iaW5kKHRoaXMpO1xuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIC8vIGdldF9rYl9tb2RpZmllcl9zdGF0ZSA9ICggZXZlbnQsIHZhbHVlICkgPT5cbiAgICAgICAgLy8gICBAX3Bydl9tb2RpZmllcnMgPSB7fVxuICAgICAgICAvLyAgIGZvciAoIG1vZGlmaWVyX25hbWUgb2YgQGNmZy5tb2RpZmllcl9uYW1lcyApIHtcbiAgICAgICAgLy8gICAgIEBfcHJ2X21vZGlmaWVyc1sgbW9kaWZpZXJfbmFtZSBdID0gbnVsbFxuICAgICAgICAvLyAgIGZyZWV6ZSggQF9wcnZfbW9kaWZpZXJzIClcblxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgICB0aGlzLl9zZXRfY2Fwc2xvY2tfc3RhdGUgPSB0aGlzLl9zZXRfY2Fwc2xvY2tfc3RhdGUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jZmcgPSB7Li4uZGVmYXVsdHMsIC4uLmNmZ307XG4gICAgICAgIHJlZiA9IHRoaXMuY2ZnLm1vZGlmaWVyX25hbWVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBtb2RpZmllcl9uYW1lID0gcmVmW2ldO1xuICAgICAgICAgIHRoaXMuX3Bydl9tb2RpZmllcnNbbW9kaWZpZXJfbmFtZV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZyZWV6ZSh0aGlzLl9wcnZfbW9kaWZpZXJzKTtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGdldF9jaGFuZ2VkX2tiX21vZGlmaWVyX3N0YXRlKCkge1xuICAgICAgICB2YXIgYW55X2hhc19jaGFuZ2VkLCBjaGFuZ2VkX21vZGlmaWVycywgY3J0X21vZGlmaWVycywgaSwgbGVuLCBtb2RpZmllcl9uYW1lLCByZWYsIHN0YXRlLCB0aGlzX2hhc19jaGFuZ2VkO1xuICAgICAgICAvKiBSZXR1cm4ga2V5Ym9hcmQgbW9kaWZpZXIgc3RhdGUgaWYgaXQgaGFzIGNoYW5nZWQgc2luY2UgdGhlIGxhc3QgY2FsbCwgb3IgYG51bGxgIGlmIGl0IGhhc24ndCBjaGFuZ2VkLiAqL1xuICAgICAgICAvLyBsb2coICdeMzM5ODheJywgeyBldmVudCwgfSApXG4gICAgICAgIGNydF9tb2RpZmllcnMgPSB7XG4gICAgICAgICAgX3R5cGU6IGV2ZW50LnR5cGVcbiAgICAgICAgfTtcbiAgICAgICAgY2hhbmdlZF9tb2RpZmllcnMgPSB7XG4gICAgICAgICAgX3R5cGU6IGV2ZW50LnR5cGVcbiAgICAgICAgfTtcbiAgICAgICAgYW55X2hhc19jaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgIHJlZiA9IHRoaXMuY2ZnLm1vZGlmaWVyX25hbWVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICBtb2RpZmllcl9uYW1lID0gcmVmW2ldO1xuICAgICAgICAgIHN0YXRlID0gZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZShtb2RpZmllcl9uYW1lKTtcbiAgICAgICAgICB0aGlzX2hhc19jaGFuZ2VkID0gdGhpcy5fcHJ2X21vZGlmaWVyc1ttb2RpZmllcl9uYW1lXSAhPT0gc3RhdGU7XG4gICAgICAgICAgYW55X2hhc19jaGFuZ2VkID0gYW55X2hhc19jaGFuZ2VkIHx8IHRoaXNfaGFzX2NoYW5nZWQ7XG4gICAgICAgICAgY3J0X21vZGlmaWVyc1ttb2RpZmllcl9uYW1lXSA9IHN0YXRlO1xuICAgICAgICAgIGlmICh0aGlzX2hhc19jaGFuZ2VkKSB7XG4gICAgICAgICAgICBjaGFuZ2VkX21vZGlmaWVyc1ttb2RpZmllcl9uYW1lXSA9IHN0YXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYW55X2hhc19jaGFuZ2VkKSB7XG4gICAgICAgICAgdGhpcy5fcHJ2X21vZGlmaWVycyA9IGZyZWV6ZShjcnRfbW9kaWZpZXJzKTtcbiAgICAgICAgICByZXR1cm4gY2hhbmdlZF9tb2RpZmllcnM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIF9zZXRfY2Fwc2xvY2tfc3RhdGUoY2Fwc2xvY2tfYWN0aXZlKSB7XG4gICAgICAgIGlmIChjYXBzbG9ja19hY3RpdmUgPT09IHRoaXMuX2NhcHNsb2NrX2FjdGl2ZSkge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2NhcHNsb2NrX2FjdGl2ZSA9IGNhcHNsb2NrX2FjdGl2ZTtcbiAgICAgICAgwrUuRE9NLmVtaXRfY3VzdG9tX2V2ZW50KCfCtV9rYl9jYXBzbG9ja19jaGFuZ2VkJywge1xuICAgICAgICAgIGRldGFpbDoge1xuICAgICAgICAgICAgQ2Fwc0xvY2s6IGNhcHNsb2NrX2FjdGl2ZVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgfTtcblxuICAgIF9LYi5wcm90b3R5cGUuX3Bydl9tb2RpZmllcnMgPSB7fTtcblxuICAgIF9LYi5wcm90b3R5cGUuX2NhcHNsb2NrX2FjdGl2ZSA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIF9LYjtcblxuICB9KS5jYWxsKHRoaXMpO1xuXG4gIC8vICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gb25fcHVzaDogKCBrZXluYW1lcywgaGFuZGxlciApID0+XG4gIC8vIGtleW5hbWVzICA9IFsga2V5bmFtZXMsIF0gdW5sZXNzIGlzYS5saXN0IGtleW5hbWVzXG4gIC8vIHR5cGVzICAgICA9IFsgdHlwZXMsICAgIF0gdW5sZXNzIGlzYS5saXN0IHR5cGVzXG4gIC8vIHZhbGlkYXRlLmtiX2tleW5hbWVzICBrZXluYW1lc1xuICAvLyB2YWxpZGF0ZS5rYl90eXBlcyAgICAgdHlwZXNcblxuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjI1xuICByZWYgPSB0aGlzLktiID0gKGZ1bmN0aW9uKCkge1xuICAgIGNsYXNzIEtiIGV4dGVuZHMgdGhpcy5fS2Ige1xuICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKC4uLmFyZ3VtZW50cyk7XG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAgIHRoaXMuX2hhbmRsZXJfZnJvbV93YXRjaGVyID0gdGhpcy5faGFuZGxlcl9mcm9tX3dhdGNoZXIuYmluZCh0aGlzKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5fbGlzdGVuX3RvX2tleSA9IHRoaXMuX2xpc3Rlbl90b19rZXkuYmluZCh0aGlzKTtcbiAgICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgICAgLy8gTUJNQ0RcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5fbGlzdGVuX3RvX21vZGlmaWVycyA9IHRoaXMuX2xpc3Rlbl90b19tb2RpZmllcnMuYmluZCh0aGlzKTtcbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgICAgdGhpcy5fZW1pdF9tYm1jZF9rZXlfZXZlbnRzID0gdGhpcy5fZW1pdF9tYm1jZF9rZXlfZXZlbnRzLmJpbmQodGhpcyk7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfZ2V0X2xhdGNoaW5nX2tleW5hbWUoKSB7XG4gICAgICAgIHZhciBSLCByZWYxLCByZWYxMCwgcmVmMTEsIHJlZjEyLCByZWYyLCByZWYzLCByZWY0LCByZWY1LCByZWY2LCByZWY3LCByZWY4LCByZWY5O1xuICAgICAgICBpZiAoISgoRGF0ZS5ub3coKSAtICgocmVmMSA9IChyZWYyID0gdGhpcy5fc2hyZWdbMF0pICE9IG51bGwgPyByZWYyLnQgOiB2b2lkIDApICE9IG51bGwgPyByZWYxIDogMCkpIDwgdGhpcy5jZmcubGF0Y2guZHQpKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCgocmVmMyA9IHRoaXMuX3NocmVnWzBdKSAhPSBudWxsID8gcmVmMy5kaXIgOiB2b2lkIDApICE9PSAnZG93bicpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKChyZWY0ID0gdGhpcy5fc2hyZWdbMV0pICE9IG51bGwgPyByZWY0LmRpciA6IHZvaWQgMCkgIT09ICd1cCcpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKChyZWY1ID0gdGhpcy5fc2hyZWdbMl0pICE9IG51bGwgPyByZWY1LmRpciA6IHZvaWQgMCkgIT09ICdkb3duJykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoKHJlZjYgPSB0aGlzLl9zaHJlZ1szXSkgIT0gbnVsbCA/IHJlZjYuZGlyIDogdm9pZCAwKSAhPT0gJ3VwJykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoKCgocmVmOSA9IHRoaXMuX3NocmVnWzBdKSAhPSBudWxsID8gcmVmOS5uYW1lIDogdm9pZCAwKSAhPT0gKHJlZjggPSAocmVmMTAgPSB0aGlzLl9zaHJlZ1sxXSkgIT0gbnVsbCA/IHJlZjEwLm5hbWUgOiB2b2lkIDApIHx8IHJlZjggIT09IChyZWY3ID0gKHJlZjExID0gdGhpcy5fc2hyZWdbMl0pICE9IG51bGwgPyByZWYxMS5uYW1lIDogdm9pZCAwKSkgfHwgcmVmNyAhPT0gKChyZWYxMiA9IHRoaXMuX3NocmVnWzNdKSAhPSBudWxsID8gcmVmMTIubmFtZSA6IHZvaWQgMCkpKSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgUiA9IHRoaXMuX3NocmVnWzNdLm5hbWU7XG4gICAgICAgIHJldHVybiBSO1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX2luaXRpYWxpemVfbGF0Y2hpbmcoKSB7XG4gICAgICAgIHZhciBwdXNoO1xuICAgICAgICBpZiAodGhpcy5fbGF0Y2hpbmdfaW5pdGlhbGl6ZWQpIHtcbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9sYXRjaGluZ19pbml0aWFsaXplZCA9IHRydWU7XG4gICAgICAgIHB1c2ggPSAoZGlyLCBldmVudCkgPT4ge1xuICAgICAgICAgIHZhciBuYW1lO1xuICAgICAgICAgIG5hbWUgPSBldmVudC5rZXk7XG4gICAgICAgICAgdGhpcy5fc2hyZWcucHVzaCh7XG4gICAgICAgICAgICBkaXIsXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgdDogRGF0ZS5ub3coKVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHdoaWxlICh0aGlzLl9zaHJlZy5sZW5ndGggPiA0KSB7XG4gICAgICAgICAgICB0aGlzLl9zaHJlZy5zaGlmdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgIHJldHVybiBwdXNoKCdkb3duJywgZXZlbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICByZXR1cm4gcHVzaCgndXAnLCBldmVudCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9saXN0ZW5fdG9fa2V5X3B1c2goa2V5bmFtZSwgaGFuZGxlcikge1xuICAgICAgICB2YXIgYmVoYXZpb3IsIHN0YXRlO1xuICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgICAgICBiZWhhdmlvciA9ICdwdXNoJztcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIMK1LkRPTS5vbihkb2N1bWVudCwgJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBrZXluYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSB0cnVlO1xuICAgICAgICAgIGhhbmRsZXIoZnJlZXplKHtrZXluYW1lLCBiZWhhdmlvciwgc3RhdGUsIGV2ZW50fSkpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIMK1LkRPTS5vbihkb2N1bWVudCwgJ2tleXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0ga2V5bmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gZmFsc2U7XG4gICAgICAgICAgaGFuZGxlcihmcmVlemUoe2tleW5hbWUsIGJlaGF2aW9yLCBzdGF0ZSwgZXZlbnR9KSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfbGlzdGVuX3RvX2tleV90b2dnbGUoa2V5bmFtZSwgaGFuZGxlcikge1xuICAgICAgICB2YXIgYmVoYXZpb3IsIHNraXBfbmV4dCwgc3RhdGU7XG4gICAgICAgIHN0YXRlID0gZmFsc2U7XG4gICAgICAgIGJlaGF2aW9yID0gJ3RvZ2dsZSc7XG4gICAgICAgIHNraXBfbmV4dCA9IGZhbHNlO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChldmVudC5rZXkgIT09IGtleW5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZSA9IHRydWU7XG4gICAgICAgICAgc2tpcF9uZXh0ID0gdHJ1ZTtcbiAgICAgICAgICAvLyBkZWJ1ZyAnXl9saXN0ZW5fdG9fa2V5QDIyM14nLCAna2V5ZG93bicsIHsga2V5bmFtZSwgYmVoYXZpb3IsIGVudHJ5LCB9XG4gICAgICAgICAgaGFuZGxlcihmcmVlemUoe2tleW5hbWUsIGJlaGF2aW9yLCBzdGF0ZSwgZXZlbnR9KSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBrZXluYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChza2lwX25leHQpIHtcbiAgICAgICAgICAgIHNraXBfbmV4dCA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBkZWJ1ZyAnXl9saXN0ZW5fdG9fa2V5QDIyM14nLCAndG9nZ2xlL2tleXVwJywgeyBrZXluYW1lLCBiZWhhdmlvciwgZW50cnksIH1cbiAgICAgICAgICBoYW5kbGVyKGZyZWV6ZSh7a2V5bmFtZSwgYmVoYXZpb3IsIHN0YXRlLCBldmVudH0pKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9saXN0ZW5fdG9fa2V5X2xhdGNoKGtleW5hbWUsIGhhbmRsZXIpIHtcbiAgICAgICAgdmFyIGJlaGF2aW9yLCBzdGF0ZTtcbiAgICAgICAgdGhpcy5faW5pdGlhbGl6ZV9sYXRjaGluZygpO1xuICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgICAgICBiZWhhdmlvciA9ICdsYXRjaCc7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICDCtS5ET00ub24oZG9jdW1lbnQsICdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChrZXluYW1lID09PSB0aGlzLl9nZXRfbGF0Y2hpbmdfa2V5bmFtZSgpKSB7XG4gICAgICAgICAgICBzdGF0ZSA9ICFzdGF0ZTtcbiAgICAgICAgICAgIGhhbmRsZXIoZnJlZXplKHtrZXluYW1lLCBiZWhhdmlvciwgc3RhdGUsIGV2ZW50fSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9saXN0ZW5fdG9fa2V5X3RsYXRjaChrZXluYW1lLCBoYW5kbGVyKSB7XG4gICAgICAgIHZhciBiZWhhdmlvciwgaXNfbGF0Y2hlZCwgc3RhdGU7XG4gICAgICAgIHN0YXRlID0gZmFsc2U7XG4gICAgICAgIGJlaGF2aW9yID0gJ3RsYXRjaCc7XG4gICAgICAgIGlzX2xhdGNoZWQgPSBmYWxzZTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHRoaXMuX2xpc3Rlbl90b19rZXkoa2V5bmFtZSwgJ2xhdGNoJywgKGQpID0+IHtcbiAgICAgICAgICByZXR1cm4gaXNfbGF0Y2hlZCA9IGQuc3RhdGU7XG4gICAgICAgIH0pO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChldmVudC5rZXkgIT09IGtleW5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdGF0ZSA9ICFpc19sYXRjaGVkO1xuICAgICAgICAgIGhhbmRsZXIoZnJlZXplKHtrZXluYW1lLCBiZWhhdmlvciwgc3RhdGUsIGV2ZW50fSkpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIMK1LkRPTS5vbihkb2N1bWVudCwgJ2tleXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0ga2V5bmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gaXNfbGF0Y2hlZDtcbiAgICAgICAgICBoYW5kbGVyKGZyZWV6ZSh7a2V5bmFtZSwgYmVoYXZpb3IsIHN0YXRlLCBldmVudH0pKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9saXN0ZW5fdG9fa2V5X3B0bGF0Y2goa2V5bmFtZSwgaGFuZGxlcikge1xuICAgICAgICB2YXIgYmVoYXZpb3IsIGlzX2xhdGNoZWQsIHN0YXRlO1xuICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgICAgICBiZWhhdmlvciA9ICdwdGxhdGNoJztcbiAgICAgICAgaXNfbGF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdGhpcy5fbGlzdGVuX3RvX2tleShrZXluYW1lLCAnbGF0Y2gnLCAoZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBpc19sYXRjaGVkID0gZC5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICDCtS5ET00ub24oZG9jdW1lbnQsICdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0ga2V5bmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc19sYXRjaGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSB0cnVlO1xuICAgICAgICAgIGhhbmRsZXIoZnJlZXplKHtrZXluYW1lLCBiZWhhdmlvciwgc3RhdGUsIGV2ZW50fSkpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIMK1LkRPTS5vbihkb2N1bWVudCwgJ2tleXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0ga2V5bmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpc19sYXRjaGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICBoYW5kbGVyKGZyZWV6ZSh7a2V5bmFtZSwgYmVoYXZpb3IsIHN0YXRlLCBldmVudH0pKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIF9saXN0ZW5fdG9fa2V5X250bGF0Y2goa2V5bmFtZSwgaGFuZGxlcikge1xuICAgICAgICB2YXIgYmVoYXZpb3IsIGlzX2xhdGNoZWQsIHN0YXRlO1xuICAgICAgICBzdGF0ZSA9IGZhbHNlO1xuICAgICAgICBiZWhhdmlvciA9ICdudGxhdGNoJztcbiAgICAgICAgaXNfbGF0Y2hlZCA9IGZhbHNlO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgdGhpcy5fbGlzdGVuX3RvX2tleShrZXluYW1lLCAnbGF0Y2gnLCAoZCkgPT4ge1xuICAgICAgICAgIHJldHVybiBpc19sYXRjaGVkID0gZC5zdGF0ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICDCtS5ET00ub24oZG9jdW1lbnQsICdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKGV2ZW50LmtleSAhPT0ga2V5bmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghaXNfbGF0Y2hlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHN0YXRlID0gZmFsc2U7XG4gICAgICAgICAgaGFuZGxlcihmcmVlemUoe2tleW5hbWUsIGJlaGF2aW9yLCBzdGF0ZSwgZXZlbnR9KSk7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgwrUuRE9NLm9uKGRvY3VtZW50LCAna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoZXZlbnQua2V5ICE9PSBrZXluYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCFpc19sYXRjaGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RhdGUgPSB0cnVlO1xuICAgICAgICAgIGhhbmRsZXIoZnJlZXplKHtrZXluYW1lLCBiZWhhdmlvciwgc3RhdGUsIGV2ZW50fSkpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgICBfaGFuZGxlcl9mcm9tX3dhdGNoZXIod2F0Y2hlcikge1xuICAgICAgICBib3VuZE1ldGhvZENoZWNrKHRoaXMsIHJlZik7XG4gICAgICAgIC8qIFRBSU5UIGNvdWxkIHVzZSBzaW5nbGUgZnVuY3Rpb24gZm9yIGFsbCBoYW5kbGVycyB0aGF0IGVtaXQgdGhlIHNhbWUgZXZlbnQgKi9cbiAgICAgICAgdmFsaWRhdGUua2Jfd2F0Y2hlcih3YXRjaGVyKTtcbiAgICAgICAgaWYgKGlzYS5mdW5jdGlvbih3YXRjaGVyKSkge1xuICAgICAgICAgIHJldHVybiB3YXRjaGVyO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmdW5jdGlvbihkKSB7XG4gICAgICAgICAgcmV0dXJuIMK1LkRPTS5lbWl0X2N1c3RvbV9ldmVudCh3YXRjaGVyLCB7XG4gICAgICAgICAgICBkZXRhaWw6IGRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgX2xpc3Rlbl90b19rZXkoa2V5bmFtZSwgYmVoYXZpb3IsIHdhdGNoZXIpIHtcbiAgICAgICAgdmFyIGhhbmRsZXI7XG4gICAgICAgIGJvdW5kTWV0aG9kQ2hlY2sodGhpcywgcmVmKTtcbiAgICAgICAgaWYgKGtleW5hbWUgPT09ICdTcGFjZScpIHtcbiAgICAgICAgICBrZXluYW1lID0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIHZhbGlkYXRlLmtiX2tleW5hbWUoa2V5bmFtZSk7XG4gICAgICAgIHZhbGlkYXRlLmtiX2tleXR5cGUoYmVoYXZpb3IpO1xuICAgICAgICBoYW5kbGVyID0gdGhpcy5faGFuZGxlcl9mcm9tX3dhdGNoZXIod2F0Y2hlcik7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBzd2l0Y2ggKGJlaGF2aW9yKSB7XG4gICAgICAgICAgY2FzZSAncHVzaCc6XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5fdG9fa2V5X3B1c2goa2V5bmFtZSwgaGFuZGxlcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICd0b2dnbGUnOlxuICAgICAgICAgICAgdGhpcy5fbGlzdGVuX3RvX2tleV90b2dnbGUoa2V5bmFtZSwgaGFuZGxlcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdsYXRjaCc6XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5fdG9fa2V5X2xhdGNoKGtleW5hbWUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAndGxhdGNoJzpcbiAgICAgICAgICAgIHRoaXMuX2xpc3Rlbl90b19rZXlfdGxhdGNoKGtleW5hbWUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnbnRsYXRjaCc6XG4gICAgICAgICAgICB0aGlzLl9saXN0ZW5fdG9fa2V5X250bGF0Y2goa2V5bmFtZSwgaGFuZGxlcik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlICdwdGxhdGNoJzpcbiAgICAgICAgICAgIHRoaXMuX2xpc3Rlbl90b19rZXlfcHRsYXRjaChrZXluYW1lLCBoYW5kbGVyKTtcbiAgICAgICAgfVxuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGwvKiBOT1RFIG1heSByZXR1cm4gYSBgcmVtb3ZlX2xpc3RlbmVyYCBtZXRob2QgSVRGICovO1xuICAgICAgfVxuXG4gICAgICBfbGlzdGVuX3RvX21vZGlmaWVycyh3YXRjaGVyID0gbnVsbCkge1xuICAgICAgICB2YXIgZXZlbnRuYW1lLCBoYW5kbGVfa2JsaWtlX2V2ZW50LCBoYW5kbGVyLCBpLCBsZW4sIHJlZjE7XG4gICAgICAgIGJvdW5kTWV0aG9kQ2hlY2sodGhpcywgcmVmKTtcbiAgICAgICAgaWYgKHdhdGNoZXIgIT0gbnVsbCkge1xuICAgICAgICAgIGhhbmRsZXIgPSB0aGlzLl9oYW5kbGVyX2Zyb21fd2F0Y2hlcih3YXRjaGVyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBoYW5kbGVyID0gdGhpcy5fZW1pdF9tYm1jZF9rZXlfZXZlbnRzO1xuICAgICAgICB9XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBoYW5kbGVfa2JsaWtlX2V2ZW50ID0gKGV2ZW50KSA9PiB7XG4gICAgICAgICAgdmFyIG1vZGlmaWVyX3N0YXRlO1xuICAgICAgICAgIG1vZGlmaWVyX3N0YXRlID0gdGhpcy5nZXRfY2hhbmdlZF9rYl9tb2RpZmllcl9zdGF0ZShldmVudCk7XG4gICAgICAgICAgaWYgKG1vZGlmaWVyX3N0YXRlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBoYW5kbGVyKG1vZGlmaWVyX3N0YXRlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5fc2V0X2NhcHNsb2NrX3N0YXRlKGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ0NhcHNMb2NrJykpO1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9O1xuICAgICAgICByZWYxID0gdGhpcy5jZmcua2JsaWtlX2V2ZW50bmFtZXM7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZWYxLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgZXZlbnRuYW1lID0gcmVmMVtpXTtcbiAgICAgICAgICDCtS5ET00ub24oZG9jdW1lbnQsIGV2ZW50bmFtZSwgaGFuZGxlX2tibGlrZV9ldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIMK1LkRPTS5vbihkb2N1bWVudCwgJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAvLyBoYW5kbGVfa2JsaWtlX2V2ZW50IGV2ZW50ICMjIyAhISEhISEhISEhISEhISEhISEhISEhICMjI1xuICAgICAgICAgIC8qIFRBSU5UIGxvZ2ljIGlzIHF1ZXN0aW9uYWJsZSAqL1xuICAgICAgICAgIGlmIChldmVudC5rZXkgPT09ICdDYXBzTG9jaycpIHtcbiAgICAgICAgICAgIHRoaXMuX3NldF9jYXBzbG9ja19zdGF0ZSghdGhpcy5fY2Fwc2xvY2tfYWN0aXZlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fc2V0X2NhcHNsb2NrX3N0YXRlKGV2ZW50LmdldE1vZGlmaWVyU3RhdGUoJ0NhcHNMb2NrJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICDCtS5ET00ub24oZG9jdW1lbnQsICdrZXl1cCcsIChldmVudCkgPT4ge1xuICAgICAgICAgIGlmIChldmVudC5rZXkgPT09ICdDYXBzTG9jaycpIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZV9rYmxpa2VfZXZlbnQgZXZlbnQgIyMjICEhISEhISEhISEhISEhISEhISEhISEgIyMjXG4gICAgICAgICAgICAvKiBUQUlOVCBsb2dpYyBpcyBxdWVzdGlvbmFibGUgKi9cbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLl9zZXRfY2Fwc2xvY2tfc3RhdGUoZXZlbnQuZ2V0TW9kaWZpZXJTdGF0ZSgnQ2Fwc0xvY2snKSk7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgX2VtaXRfbWJtY2Rfa2V5X2V2ZW50cyhkKSB7XG4gICAgICAgIHZhciBldmVudG5hbWUsIGtleSwgc3RhdGU7XG4gICAgICAgIGJvdW5kTWV0aG9kQ2hlY2sodGhpcywgcmVmKTtcbi8qIEFjY2VwdHMgYW4gb2JqZWN0IHdpdGggbW9kaWZpZXIgbmFtZXMgYXMga2V5cywgYm9vbGVhbnMgYXMgdmFsdWVzOyB3aWxsIGVtaXQgYGtleWRvd25gLCBga2V5dXBgXG4gICBldmVudHMgYXMgbmVlZGVkLiAqL1xuLyogVEFJTlQgb25seSBpdGVyYXRlIG92ZXIgbW9kaWZpZXIgbmFtZXM/ICovXG4gICAgICAgIGZvciAoa2V5IGluIGQpIHtcbiAgICAgICAgICBzdGF0ZSA9IGRba2V5XTtcbiAgICAgICAgICBpZiAoa2V5ID09PSAnX3R5cGUnKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZXZlbnRuYW1lID0gc3RhdGUgPyAna2V5ZG93bicgOiAna2V5dXAnO1xuICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEtleWJvYXJkRXZlbnQoZXZlbnRuYW1lLCB7a2V5fSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8vICMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLyBfZGVmYXVsdHM6IGZyZWV6ZSB7XG4gICAgLy8gICBzdGF0ZTogZnJlZXplIHsgZG93bjogZmFsc2UsIHVwOiBmYWxzZSwgdG9nZ2xlOiBmYWxzZSwgbGF0Y2g6IGZhbHNlLCB0bGF0Y2g6IGZhbHNlLCB9XG4gICAgLy8gICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIEtiLnByb3RvdHlwZS5fc2hyZWcgPSBbXTtcblxuICAgIEtiLnByb3RvdHlwZS5fbGF0Y2hpbmdfaW5pdGlhbGl6ZWQgPSBmYWxzZTtcblxuICAgIHJldHVybiBLYjtcblxuICB9KS5jYWxsKHRoaXMpO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1rYi5qcy5tYXAiLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIFRVO1xuXG4gIFRVID0gcmVxdWlyZSgnLi4vZGVwcy90cmF2ZXJzZV91dGlsLmpzJyk7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICB0aGlzLkxpbmVmaW5kZXIgPSBjbGFzcyBMaW5lZmluZGVyIHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGNvbnN0cnVjdG9yKGNmZykge1xuICAgICAgLyogVEFJTlQgdXNlIGludGVydHlwZSAqL1xuICAgICAgdmFyIGRlZmF1bHRzO1xuICAgICAgZGVmYXVsdHMgPSB7XG4gICAgICAgIGJveF9lbGVtZW50X25hbWU6ICdkaXYnLFxuICAgICAgICBib3hfY2xhc3NfbmFtZTogJ2JveCcsXG4gICAgICAgIHh4eF9oZWlnaHRfZmFjdG9yOiAxIC8gMlxuICAgICAgfTtcbiAgICAgIHRoaXMuLyogcmVsYXRpdmUgbWluaW11bSBoZWlnaHQgdG8gcmVjb2duaXplIGxpbmUgc3RlcCAqL2NmZyA9IE9iamVjdC5mcmVlemUoey4uLmRlZmF1bHRzLCAuLi5jZmd9KTtcbiAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBfZHJhd19ib3gocmVjdGFuZ2xlLCBjZmcpIHtcbiAgICAgIHZhciBib3g7XG4gICAgICBjZmcgPSB7Li4udGhpcy5jZmcsIC4uLmNmZ307XG4gICAgICBib3ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KGNmZy5lbGVtZW50X25hbWUpO1xuICAgICAgYm94LnN0eWxlLnRvcCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgKyByZWN0YW5nbGUudG9wICsgJ3B4JztcbiAgICAgIGJveC5zdHlsZS5sZWZ0ID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbExlZnQgKyByZWN0YW5nbGUubGVmdCArICdweCc7XG4gICAgICBib3guc3R5bGUud2lkdGggPSByZWN0YW5nbGUud2lkdGggLSAxICsgJ3B4JzsgLy8gY29sbGFwc2UgYm9yZGVyc1xuICAgICAgYm94LnN0eWxlLmhlaWdodCA9IHJlY3RhbmdsZS5oZWlnaHQgKyAncHgnO1xuICAgICAgYm94LmNsYXNzTGlzdC5hZGQoY2ZnLmNsYXNzX25hbWUpO1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChib3gpO1xuICAgICAgcmV0dXJuIGJveDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIGRyYXdfYm94KHJlY3RhbmdsZSkge1xuICAgICAgdmFyIGJveDtcbiAgICAgIGJveCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGhpcy5jZmcuYm94X2VsZW1lbnRfbmFtZSk7XG4gICAgICBib3guc3R5bGUudG9wID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCArIHJlY3RhbmdsZS50b3AgKyAncHgnO1xuICAgICAgYm94LnN0eWxlLmxlZnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsTGVmdCArIHJlY3RhbmdsZS5sZWZ0ICsgJ3B4JztcbiAgICAgIGJveC5zdHlsZS53aWR0aCA9IHJlY3RhbmdsZS53aWR0aCAtIDEgKyAncHgnOyAvLyBjb2xsYXBzZSBib3JkZXJzXG4gICAgICBib3guc3R5bGUuaGVpZ2h0ID0gcmVjdGFuZ2xlLmhlaWdodCArICdweCc7XG4gICAgICBib3guY2xhc3NMaXN0LmFkZCh0aGlzLmNmZy5ib3hfY2xhc3NfbmFtZSk7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJveCk7XG4gICAgICByZXR1cm4gYm94O1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2dldF9uZXh0X2Nocl9yZWN0YW5nbGVzKG5vZGUsIGMxLCBjMikge1xuICAgICAgdmFyIHJhbmdlLCBzZWxlY3Rpb247XG4gICAgICBUVS5UcmF2ZXJzZVV0aWwuZ2V0TmV4dENoYXIoYzEsIGMyLCBbXSwgZmFsc2UpO1xuICAgICAgc2VsZWN0aW9uID0gVFUuVHJhdmVyc2VVdGlsLnNldFNlbGVjdGlvbihjMSwgYzIpO1xuICAgICAgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcbiAgICAgIGlmICghbm9kZS5jb250YWlucyhyYW5nZS5zdGFydENvbnRhaW5lci5wYXJlbnROb2RlKSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIGlmICghbm9kZS5jb250YWlucyhyYW5nZS5lbmRDb250YWluZXIucGFyZW50Tm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmFuZ2UuZ2V0Q2xpZW50UmVjdHMoKTtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICogd2Fsa19jaHJfcmVjdGFuZ2xlc19vZl9ub2RlKG5vZGUpIHtcbiAgICAgIHZhciBjMSwgYzIsIHJlY3RhbmdsZXMsIHRleHRfbm9kZTtcbiAgICAgIHRleHRfbm9kZSA9IG5vZGUuY2hpbGROb2Rlc1swXTtcbiAgICAgIGMxID0gbmV3IFRVLkN1cnNvcih0ZXh0X25vZGUsIDAsIHRleHRfbm9kZS5kYXRhKTtcbiAgICAgIGMyID0gbmV3IFRVLkN1cnNvcih0ZXh0X25vZGUsIDAsIHRleHRfbm9kZS5kYXRhKTtcbiAgICAgIFRVLlRyYXZlcnNlVXRpbC5zZXRTZWxlY3Rpb24oYzEsIGMyKTtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIHJlY3RhbmdsZXMgPSB0aGlzLl9nZXRfbmV4dF9jaHJfcmVjdGFuZ2xlcyhub2RlLCBjMSwgYzIpO1xuICAgICAgICBpZiAocmVjdGFuZ2xlcyA9PSBudWxsKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgeWllbGQqIHJlY3RhbmdsZXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIF9yZXNldF9saW5lX3dhbGtlcihzKSB7XG4gICAgICBzLm1pbl90b3AgPSArMmUzMDg7XG4gICAgICBzLm1heF9ib3R0b20gPSAtMmUzMDg7XG4gICAgICBzLm1pbl9sZWZ0ID0gKzJlMzA4O1xuICAgICAgcy5tYXhfcmlnaHQgPSAtMmUzMDg7XG4gICAgICBzLmF2Z19oZWlnaHQgPSAwO1xuICAgICAgcy5hdmdfYm90dG9tID0gMDtcbiAgICAgIHMuY291bnQgPSAwO1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAqIHdhbGtfbGluZV9yZWN0YW5nbGVzX29mX25vZGUobm9kZSkge1xuICAgICAgdmFyIHJlY3RhbmdsZSwgcmVmLCBzO1xuICAgICAgdGhpcy5fcmVzZXRfbGluZV93YWxrZXIocyA9IHt9KTtcbiAgICAgIHJlZiA9IHRoaXMud2Fsa19jaHJfcmVjdGFuZ2xlc19vZl9ub2RlKG5vZGUpO1xuICAgICAgZm9yIChyZWN0YW5nbGUgb2YgcmVmKSB7XG4gICAgICAgIGlmIChzLmNvdW50ID4gMCAmJiByZWN0YW5nbGUuYm90dG9tIC0gcy5hdmdfYm90dG9tID4gcy5hdmdfaGVpZ2h0ICogdGhpcy5jZmcueHh4X2hlaWdodF9mYWN0b3IpIHtcbiAgICAgICAgICB5aWVsZCBuZXcgRE9NUmVjdChzLm1pbl9sZWZ0LCBzLm1pbl90b3AsIHMubWF4X3JpZ2h0IC0gcy5taW5fbGVmdCwgcy5tYXhfYm90dG9tIC0gcy5taW5fdG9wKTsgLy8gbGVmdCAvLyB0b3AgLy8gd2lkdGggLy8gaGVpZ2h0XG4gICAgICAgICAgdGhpcy5fcmVzZXRfbGluZV93YWxrZXIocyk7XG4gICAgICAgIH1cbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIC8vIGRyYXdfYm94IHJlY3RhbmdsZVxuICAgICAgICBzLmNvdW50Kys7XG4gICAgICAgIHMubWluX3RvcCA9IE1hdGgubWluKHMubWluX3RvcCwgcmVjdGFuZ2xlLnRvcCk7XG4gICAgICAgIHMubWF4X2JvdHRvbSA9IE1hdGgubWF4KHMubWF4X2JvdHRvbSwgcmVjdGFuZ2xlLmJvdHRvbSk7XG4gICAgICAgIHMubWluX2xlZnQgPSBNYXRoLm1pbihzLm1pbl9sZWZ0LCByZWN0YW5nbGUubGVmdCk7XG4gICAgICAgIHMubWF4X3JpZ2h0ID0gTWF0aC5tYXgocy5tYXhfcmlnaHQsIHJlY3RhbmdsZS5yaWdodCk7XG4gICAgICAgIHMuYXZnX2hlaWdodCA9IChzLmF2Z19oZWlnaHQgKiAocy5jb3VudCAtIDEpIC8gcy5jb3VudCkgKyAocmVjdGFuZ2xlLmhlaWdodCAqIDEgLyBzLmNvdW50KTtcbiAgICAgICAgcy5hdmdfYm90dG9tID0gKHMuYXZnX2JvdHRvbSAqIChzLmNvdW50IC0gMSkgLyBzLmNvdW50KSArIChyZWN0YW5nbGUuYm90dG9tICogMSAvIHMuY291bnQpO1xuICAgICAgfVxuICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGlmIChzLmNvdW50ID4gMCkge1xuICAgICAgICB5aWVsZCBuZXcgRE9NUmVjdChzLm1pbl9sZWZ0LCBzLm1pbl90b3AsIHMubWF4X3JpZ2h0IC0gcy5taW5fbGVmdCwgcy5tYXhfYm90dG9tIC0gcy5taW5fdG9wKTsgLy8gbGVmdCAvLyB0b3AgLy8gd2lkdGggLy8gaGVpZ2h0XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bGluZWZpbmRlci5qcy5tYXAiLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdGhpcy50eXBlcyA9IG5ldyAocmVxdWlyZSgnaW50ZXJ0eXBlJykpLkludGVydHlwZSgpO1xuXG4gIE9iamVjdC5hc3NpZ24odGhpcywgdGhpcy50eXBlcy5leHBvcnQoKSk7XG5cbiAgLy8gIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEBkZWNsYXJlICdrYl9rZXl0eXBlcycsIHRlc3RzOlxuICAvLyAgIFwieCBpcyBhIGxpc3Qgb2Yga2Jfa2V5dHlwZVwiOiAgICAgKCB4ICkgLT4gQGlzYS5saXN0X29mICdrYl9rZXl0eXBlJywgeFxuICAvLyAgIFwieCBpcyBub3QgZW1wdHlcIjogICAgICAgICAgICAgICAgICAgKCB4ICkgLT4gbm90IEBpc2EuZW1wdHkgeFxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5kZWNsYXJlKCdrYl9rZXl0eXBlJywge1xuICAgIHRlc3RzOiB7XG4gICAgICBcInggaXMgb25lIG9mICd0b2dnbGUnLCAnbGF0Y2gnLCAndGxhdGNoJywgJ3B0bGF0Y2gnLCAnbnRsYXRjaCcsICdwdXNoJ1wiOiBmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiB4ID09PSAndG9nZ2xlJyB8fCB4ID09PSAnbGF0Y2gnIHx8IHggPT09ICd0bGF0Y2gnIHx8IHggPT09ICdwdGxhdGNoJyB8fCB4ID09PSAnbnRsYXRjaCcgfHwgeCA9PT0gJ3B1c2gnO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8gIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIEBkZWNsYXJlICdrYl9rZXluYW1lcycsIHRlc3RzOlxuICAvLyAgIFwieCBpcyBhIGxpc3Qgb2Yga2Jfa2V5bmFtZVwiOiAgKCB4ICkgLT4gQGlzYS5saXN0X29mICdrYl9rZXluYW1lJywgeFxuICAvLyAgIFwieCBpcyBub3QgZW1wdHlcIjogICAgICAgICAgICAgICAgICAgKCB4ICkgLT4gbm90IEBpc2EuZW1wdHkgeFxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5kZWNsYXJlKCdrYl9rZXluYW1lJywge1xuICAgIHRlc3RzOiB7XG4gICAgICBcInggaXMgYSBub25lbXB0eV90ZXh0XCI6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNhLm5vbmVtcHR5X3RleHQoeCk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuZGVjbGFyZSgna2Jfd2F0Y2hlcicsIHtcbiAgICB0ZXN0czoge1xuICAgICAgXCJ4IGlzIGEgZnVuY3Rpb24gb3IgYSBub25lbXB0eV90ZXh0XCI6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmlzYS5mdW5jdGlvbih4KSkgfHwgKHRoaXMuaXNhLm5vbmVtcHR5X3RleHQoeCkpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiBUQUlOVCBwcm9iYWJseSBub3QgY29ycmVjdCB0byBvbmx5IGNoZWNrIGZvciBFbGVtZW50LCBhdCBsZWFzdCBpbiBzb21lIGNhc2VzIGNvdWxkIGJlIE5vZGUgYXMgd2VsbCAqL1xuICB0aGlzLmRlY2xhcmUoJ2RlbGVtZW50JywgZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiAoeCA9PT0gZG9jdW1lbnQpIHx8ICh4IGluc3RhbmNlb2YgRWxlbWVudCk7XG4gIH0pO1xuXG4gIHRoaXMuZGVjbGFyZSgnZWxlbWVudCcsIGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4geCBpbnN0YW5jZW9mIEVsZW1lbnQ7XG4gIH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD10eXBlcy5qcy5tYXAiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuXHR0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcblx0dHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG5cdChnbG9iYWwgPSBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwubG91cGUgPSB7fSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBjb21tb25qc0dsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9O1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZUNvbW1vbmpzTW9kdWxlKGZuLCBtb2R1bGUpIHtcblx0XHRyZXR1cm4gbW9kdWxlID0geyBleHBvcnRzOiB7fSB9LCBmbihtb2R1bGUsIG1vZHVsZS5leHBvcnRzKSwgbW9kdWxlLmV4cG9ydHM7XG5cdH1cblxuXHR2YXIgdHlwZURldGVjdCA9IGNyZWF0ZUNvbW1vbmpzTW9kdWxlKGZ1bmN0aW9uIChtb2R1bGUsIGV4cG9ydHMpIHtcblx0KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcblx0XHQgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCkgO1xuXHR9KGNvbW1vbmpzR2xvYmFsLCAoZnVuY3Rpb24gKCkge1xuXHQvKiAhXG5cdCAqIHR5cGUtZGV0ZWN0XG5cdCAqIENvcHlyaWdodChjKSAyMDEzIGpha2UgbHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuXHQgKiBNSVQgTGljZW5zZWRcblx0ICovXG5cdHZhciBwcm9taXNlRXhpc3RzID0gdHlwZW9mIFByb21pc2UgPT09ICdmdW5jdGlvbic7XG5cblx0LyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cblx0dmFyIGdsb2JhbE9iamVjdCA9IHR5cGVvZiBzZWxmID09PSAnb2JqZWN0JyA/IHNlbGYgOiBjb21tb25qc0dsb2JhbDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBpZC1ibGFja2xpc3RcblxuXHR2YXIgc3ltYm9sRXhpc3RzID0gdHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBtYXBFeGlzdHMgPSB0eXBlb2YgTWFwICE9PSAndW5kZWZpbmVkJztcblx0dmFyIHNldEV4aXN0cyA9IHR5cGVvZiBTZXQgIT09ICd1bmRlZmluZWQnO1xuXHR2YXIgd2Vha01hcEV4aXN0cyA9IHR5cGVvZiBXZWFrTWFwICE9PSAndW5kZWZpbmVkJztcblx0dmFyIHdlYWtTZXRFeGlzdHMgPSB0eXBlb2YgV2Vha1NldCAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBkYXRhVmlld0V4aXN0cyA9IHR5cGVvZiBEYXRhVmlldyAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBzeW1ib2xJdGVyYXRvckV4aXN0cyA9IHN5bWJvbEV4aXN0cyAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yICE9PSAndW5kZWZpbmVkJztcblx0dmFyIHN5bWJvbFRvU3RyaW5nVGFnRXhpc3RzID0gc3ltYm9sRXhpc3RzICYmIHR5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWcgIT09ICd1bmRlZmluZWQnO1xuXHR2YXIgc2V0RW50cmllc0V4aXN0cyA9IHNldEV4aXN0cyAmJiB0eXBlb2YgU2V0LnByb3RvdHlwZS5lbnRyaWVzID09PSAnZnVuY3Rpb24nO1xuXHR2YXIgbWFwRW50cmllc0V4aXN0cyA9IG1hcEV4aXN0cyAmJiB0eXBlb2YgTWFwLnByb3RvdHlwZS5lbnRyaWVzID09PSAnZnVuY3Rpb24nO1xuXHR2YXIgc2V0SXRlcmF0b3JQcm90b3R5cGUgPSBzZXRFbnRyaWVzRXhpc3RzICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihuZXcgU2V0KCkuZW50cmllcygpKTtcblx0dmFyIG1hcEl0ZXJhdG9yUHJvdG90eXBlID0gbWFwRW50cmllc0V4aXN0cyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IE1hcCgpLmVudHJpZXMoKSk7XG5cdHZhciBhcnJheUl0ZXJhdG9yRXhpc3RzID0gc3ltYm9sSXRlcmF0b3JFeGlzdHMgJiYgdHlwZW9mIEFycmF5LnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID09PSAnZnVuY3Rpb24nO1xuXHR2YXIgYXJyYXlJdGVyYXRvclByb3RvdHlwZSA9IGFycmF5SXRlcmF0b3JFeGlzdHMgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKFtdW1N5bWJvbC5pdGVyYXRvcl0oKSk7XG5cdHZhciBzdHJpbmdJdGVyYXRvckV4aXN0cyA9IHN5bWJvbEl0ZXJhdG9yRXhpc3RzICYmIHR5cGVvZiBTdHJpbmcucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPT09ICdmdW5jdGlvbic7XG5cdHZhciBzdHJpbmdJdGVyYXRvclByb3RvdHlwZSA9IHN0cmluZ0l0ZXJhdG9yRXhpc3RzICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZignJ1tTeW1ib2wuaXRlcmF0b3JdKCkpO1xuXHR2YXIgdG9TdHJpbmdMZWZ0U2xpY2VMZW5ndGggPSA4O1xuXHR2YXIgdG9TdHJpbmdSaWdodFNsaWNlTGVuZ3RoID0gLTE7XG5cdC8qKlxuXHQgKiAjIyMgdHlwZU9mIChvYmopXG5cdCAqXG5cdCAqIFVzZXMgYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmdgIHRvIGRldGVybWluZSB0aGUgdHlwZSBvZiBhbiBvYmplY3QsXG5cdCAqIG5vcm1hbGlzaW5nIGJlaGF2aW91ciBhY3Jvc3MgZW5naW5lIHZlcnNpb25zICYgd2VsbCBvcHRpbWlzZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7TWl4ZWR9IG9iamVjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IG9iamVjdCB0eXBlXG5cdCAqIEBhcGkgcHVibGljXG5cdCAqL1xuXHRmdW5jdGlvbiB0eXBlRGV0ZWN0KG9iaikge1xuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgICogUHJlOlxuXHQgICAqICAgc3RyaW5nIGxpdGVyYWwgICAgIHggMywwMzksMDM1IG9wcy9zZWMgwrExLjYyJSAoNzggcnVucyBzYW1wbGVkKVxuXHQgICAqICAgYm9vbGVhbiBsaXRlcmFsICAgIHggMSw0MjQsMTM4IG9wcy9zZWMgwrE0LjU0JSAoNzUgcnVucyBzYW1wbGVkKVxuXHQgICAqICAgbnVtYmVyIGxpdGVyYWwgICAgIHggMSw2NTMsMTUzIG9wcy9zZWMgwrExLjkxJSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICAqICAgdW5kZWZpbmVkICAgICAgICAgIHggOSw5NzgsNjYwIG9wcy9zZWMgwrExLjkyJSAoNzUgcnVucyBzYW1wbGVkKVxuXHQgICAqICAgZnVuY3Rpb24gICAgICAgICAgIHggMiw1NTYsNzY5IG9wcy9zZWMgwrExLjczJSAoNzcgcnVucyBzYW1wbGVkKVxuXHQgICAqIFBvc3Q6XG5cdCAgICogICBzdHJpbmcgbGl0ZXJhbCAgICAgeCAzOCw1NjQsNzk2IG9wcy9zZWMgwrExLjE1JSAoNzkgcnVucyBzYW1wbGVkKVxuXHQgICAqICAgYm9vbGVhbiBsaXRlcmFsICAgIHggMzEsMTQ4LDk0MCBvcHMvc2VjIMKxMS4xMCUgKDc5IHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIG51bWJlciBsaXRlcmFsICAgICB4IDMyLDY3OSwzMzAgb3BzL3NlYyDCsTEuOTAlICg3OCBydW5zIHNhbXBsZWQpXG5cdCAgICogICB1bmRlZmluZWQgICAgICAgICAgeCAzMiwzNjMsMzY4IG9wcy9zZWMgwrExLjA3JSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICAqICAgZnVuY3Rpb24gICAgICAgICAgIHggMzEsMjk2LDg3MCBvcHMvc2VjIMKxMC45NiUgKDgzIHJ1bnMgc2FtcGxlZClcblx0ICAgKi9cblx0ICB2YXIgdHlwZW9mT2JqID0gdHlwZW9mIG9iajtcblx0ICBpZiAodHlwZW9mT2JqICE9PSAnb2JqZWN0Jykge1xuXHQgICAgcmV0dXJuIHR5cGVvZk9iajtcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICAqIFByZTpcblx0ICAgKiAgIG51bGwgICAgICAgICAgICAgICB4IDI4LDY0NSw3NjUgb3BzL3NlYyDCsTEuMTclICg4MiBydW5zIHNhbXBsZWQpXG5cdCAgICogUG9zdDpcblx0ICAgKiAgIG51bGwgICAgICAgICAgICAgICB4IDM2LDQyOCw5NjIgb3BzL3NlYyDCsTEuMzclICg4NCBydW5zIHNhbXBsZWQpXG5cdCAgICovXG5cdCAgaWYgKG9iaiA9PT0gbnVsbCkge1xuXHQgICAgcmV0dXJuICdudWxsJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHdpbmRvdylgYFxuXHQgICAqICAtIE5vZGUgPT09IFwiW29iamVjdCBnbG9iYWxdXCJcblx0ICAgKiAgLSBDaHJvbWUgPT09IFwiW29iamVjdCBnbG9iYWxdXCJcblx0ICAgKiAgLSBGaXJlZm94ID09PSBcIltvYmplY3QgV2luZG93XVwiXG5cdCAgICogIC0gUGhhbnRvbUpTID09PSBcIltvYmplY3QgV2luZG93XVwiXG5cdCAgICogIC0gU2FmYXJpID09PSBcIltvYmplY3QgV2luZG93XVwiXG5cdCAgICogIC0gSUUgMTEgPT09IFwiW29iamVjdCBXaW5kb3ddXCJcblx0ICAgKiAgLSBJRSBFZGdlID09PSBcIltvYmplY3QgV2luZG93XVwiXG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh0aGlzKWBgXG5cdCAgICogIC0gQ2hyb21lIFdvcmtlciA9PT0gXCJbb2JqZWN0IGdsb2JhbF1cIlxuXHQgICAqICAtIEZpcmVmb3ggV29ya2VyID09PSBcIltvYmplY3QgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGVdXCJcblx0ICAgKiAgLSBTYWZhcmkgV29ya2VyID09PSBcIltvYmplY3QgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGVdXCJcblx0ICAgKiAgLSBJRSAxMSBXb3JrZXIgPT09IFwiW29iamVjdCBXb3JrZXJHbG9iYWxTY29wZV1cIlxuXHQgICAqICAtIElFIEVkZ2UgV29ya2VyID09PSBcIltvYmplY3QgV29ya2VyR2xvYmFsU2NvcGVdXCJcblx0ICAgKi9cblx0ICBpZiAob2JqID09PSBnbG9iYWxPYmplY3QpIHtcblx0ICAgIHJldHVybiAnZ2xvYmFsJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICAqIFByZTpcblx0ICAgKiAgIGFycmF5IGxpdGVyYWwgICAgICB4IDIsODg4LDM1MiBvcHMvc2VjIMKxMC42NyUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAgKiBQb3N0OlxuXHQgICAqICAgYXJyYXkgbGl0ZXJhbCAgICAgIHggMjIsNDc5LDY1MCBvcHMvc2VjIMKxMC45NiUgKDgxIHJ1bnMgc2FtcGxlZClcblx0ICAgKi9cblx0ICBpZiAoXG5cdCAgICBBcnJheS5pc0FycmF5KG9iaikgJiZcblx0ICAgIChzeW1ib2xUb1N0cmluZ1RhZ0V4aXN0cyA9PT0gZmFsc2UgfHwgIShTeW1ib2wudG9TdHJpbmdUYWcgaW4gb2JqKSlcblx0ICApIHtcblx0ICAgIHJldHVybiAnQXJyYXknO1xuXHQgIH1cblxuXHQgIC8vIE5vdCBjYWNoaW5nIGV4aXN0ZW5jZSBvZiBgd2luZG93YCBhbmQgcmVsYXRlZCBwcm9wZXJ0aWVzIGR1ZSB0byBwb3RlbnRpYWxcblx0ICAvLyBmb3IgYHdpbmRvd2AgdG8gYmUgdW5zZXQgYmVmb3JlIHRlc3RzIGluIHF1YXNpLWJyb3dzZXIgZW52aXJvbm1lbnRzLlxuXHQgIGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JyAmJiB3aW5kb3cgIT09IG51bGwpIHtcblx0ICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL2Jyb3dzZXJzLmh0bWwjbG9jYXRpb24pXG5cdCAgICAgKiBXaGF0V0cgSFRNTCQ3LjcuMyAtIFRoZSBgTG9jYXRpb25gIGludGVyZmFjZVxuXHQgICAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh3aW5kb3cubG9jYXRpb24pYGBcblx0ICAgICAqICAtIElFIDw9MTEgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgICAqICAtIElFIEVkZ2UgPD0xMyA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxuXHQgICAgICovXG5cdCAgICBpZiAodHlwZW9mIHdpbmRvdy5sb2NhdGlvbiA9PT0gJ29iamVjdCcgJiYgb2JqID09PSB3aW5kb3cubG9jYXRpb24pIHtcblx0ICAgICAgcmV0dXJuICdMb2NhdGlvbic7XG5cdCAgICB9XG5cblx0ICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI2RvY3VtZW50KVxuXHQgICAgICogV2hhdFdHIEhUTUwkMy4xLjEgLSBUaGUgYERvY3VtZW50YCBvYmplY3Rcblx0ICAgICAqIE5vdGU6IE1vc3QgYnJvd3NlcnMgY3VycmVudGx5IGFkaGVyIHRvIHRoZSBXM0MgRE9NIExldmVsIDIgc3BlY1xuXHQgICAgICogICAgICAgKGh0dHBzOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1IVE1ML2h0bWwuaHRtbCNJRC0yNjgwOTI2OClcblx0ICAgICAqICAgICAgIHdoaWNoIHN1Z2dlc3RzIHRoYXQgYnJvd3NlcnMgc2hvdWxkIHVzZSBIVE1MVGFibGVDZWxsRWxlbWVudCBmb3Jcblx0ICAgICAqICAgICAgIGJvdGggVEQgYW5kIFRIIGVsZW1lbnRzLiBXaGF0V0cgc2VwYXJhdGVzIHRoZXNlLlxuXHQgICAgICogICAgICAgV2hhdFdHIEhUTUwgc3RhdGVzOlxuXHQgICAgICogICAgICAgICA+IEZvciBoaXN0b3JpY2FsIHJlYXNvbnMsIFdpbmRvdyBvYmplY3RzIG11c3QgYWxzbyBoYXZlIGFcblx0ICAgICAqICAgICAgICAgPiB3cml0YWJsZSwgY29uZmlndXJhYmxlLCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBuYW1lZFxuXHQgICAgICogICAgICAgICA+IEhUTUxEb2N1bWVudCB3aG9zZSB2YWx1ZSBpcyB0aGUgRG9jdW1lbnQgaW50ZXJmYWNlIG9iamVjdC5cblx0ICAgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZG9jdW1lbnQpYGBcblx0ICAgICAqICAtIENocm9tZSA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuXHQgICAgICogIC0gRmlyZWZveCA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuXHQgICAgICogIC0gU2FmYXJpID09PSBcIltvYmplY3QgSFRNTERvY3VtZW50XVwiXG5cdCAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgRG9jdW1lbnRdXCJcblx0ICAgICAqICAtIElFIDExID09PSBcIltvYmplY3QgSFRNTERvY3VtZW50XVwiXG5cdCAgICAgKiAgLSBJRSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBIVE1MRG9jdW1lbnRdXCJcblx0ICAgICAqL1xuXHQgICAgaWYgKHR5cGVvZiB3aW5kb3cuZG9jdW1lbnQgPT09ICdvYmplY3QnICYmIG9iaiA9PT0gd2luZG93LmRvY3VtZW50KSB7XG5cdCAgICAgIHJldHVybiAnRG9jdW1lbnQnO1xuXHQgICAgfVxuXG5cdCAgICBpZiAodHlwZW9mIHdpbmRvdy5uYXZpZ2F0b3IgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAgICAgKiAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViYXBwYXBpcy5odG1sI21pbWV0eXBlYXJyYXkpXG5cdCAgICAgICAqIFdoYXRXRyBIVE1MJDguNi4xLjUgLSBQbHVnaW5zIC0gSW50ZXJmYWNlIE1pbWVUeXBlQXJyYXlcblx0ICAgICAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuYXZpZ2F0b3IubWltZVR5cGVzKWBgXG5cdCAgICAgICAqICAtIElFIDw9MTAgPT09IFwiW29iamVjdCBNU01pbWVUeXBlc0NvbGxlY3Rpb25dXCJcblx0ICAgICAgICovXG5cdCAgICAgIGlmICh0eXBlb2Ygd2luZG93Lm5hdmlnYXRvci5taW1lVHlwZXMgPT09ICdvYmplY3QnICYmXG5cdCAgICAgICAgICBvYmogPT09IHdpbmRvdy5uYXZpZ2F0b3IubWltZVR5cGVzKSB7XG5cdCAgICAgICAgcmV0dXJuICdNaW1lVHlwZUFycmF5Jztcblx0ICAgICAgfVxuXG5cdCAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAgICAgKiAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViYXBwYXBpcy5odG1sI3BsdWdpbmFycmF5KVxuXHQgICAgICAgKiBXaGF0V0cgSFRNTCQ4LjYuMS41IC0gUGx1Z2lucyAtIEludGVyZmFjZSBQbHVnaW5BcnJheVxuXHQgICAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5hdmlnYXRvci5wbHVnaW5zKWBgXG5cdCAgICAgICAqICAtIElFIDw9MTAgPT09IFwiW29iamVjdCBNU1BsdWdpbnNDb2xsZWN0aW9uXVwiXG5cdCAgICAgICAqL1xuXHQgICAgICBpZiAodHlwZW9mIHdpbmRvdy5uYXZpZ2F0b3IucGx1Z2lucyA9PT0gJ29iamVjdCcgJiZcblx0ICAgICAgICAgIG9iaiA9PT0gd2luZG93Lm5hdmlnYXRvci5wbHVnaW5zKSB7XG5cdCAgICAgICAgcmV0dXJuICdQbHVnaW5BcnJheSc7XG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgaWYgKCh0eXBlb2Ygd2luZG93LkhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nIHx8XG5cdCAgICAgICAgdHlwZW9mIHdpbmRvdy5IVE1MRWxlbWVudCA9PT0gJ29iamVjdCcpICYmXG5cdCAgICAgICAgb2JqIGluc3RhbmNlb2Ygd2luZG93LkhUTUxFbGVtZW50KSB7XG5cdCAgICAgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS93ZWJhcHBhcGlzLmh0bWwjcGx1Z2luYXJyYXkpXG5cdCAgICAgICogV2hhdFdHIEhUTUwkNC40LjQgLSBUaGUgYGJsb2NrcXVvdGVgIGVsZW1lbnQgLSBJbnRlcmZhY2UgYEhUTUxRdW90ZUVsZW1lbnRgXG5cdCAgICAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdibG9ja3F1b3RlJykpYGBcblx0ICAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgSFRNTEJsb2NrRWxlbWVudF1cIlxuXHQgICAgICAqL1xuXHQgICAgICBpZiAob2JqLnRhZ05hbWUgPT09ICdCTE9DS1FVT1RFJykge1xuXHQgICAgICAgIHJldHVybiAnSFRNTFF1b3RlRWxlbWVudCc7XG5cdCAgICAgIH1cblxuXHQgICAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI2h0bWx0YWJsZWRhdGFjZWxsZWxlbWVudClcblx0ICAgICAgICogV2hhdFdHIEhUTUwkNC45LjkgLSBUaGUgYHRkYCBlbGVtZW50IC0gSW50ZXJmYWNlIGBIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnRgXG5cdCAgICAgICAqIE5vdGU6IE1vc3QgYnJvd3NlcnMgY3VycmVudGx5IGFkaGVyIHRvIHRoZSBXM0MgRE9NIExldmVsIDIgc3BlY1xuXHQgICAgICAgKiAgICAgICAoaHR0cHM6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0yLUhUTUwvaHRtbC5odG1sI0lELTgyOTE1MDc1KVxuXHQgICAgICAgKiAgICAgICB3aGljaCBzdWdnZXN0cyB0aGF0IGJyb3dzZXJzIHNob3VsZCB1c2UgSFRNTFRhYmxlQ2VsbEVsZW1lbnQgZm9yXG5cdCAgICAgICAqICAgICAgIGJvdGggVEQgYW5kIFRIIGVsZW1lbnRzLiBXaGF0V0cgc2VwYXJhdGVzIHRoZXNlLlxuXHQgICAgICAgKiBUZXN0OiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndGQnKSlcblx0ICAgICAgICogIC0gQ2hyb21lID09PSBcIltvYmplY3QgSFRNTFRhYmxlQ2VsbEVsZW1lbnRdXCJcblx0ICAgICAgICogIC0gRmlyZWZveCA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG5cdCAgICAgICAqICAtIFNhZmFyaSA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG5cdCAgICAgICAqL1xuXHQgICAgICBpZiAob2JqLnRhZ05hbWUgPT09ICdURCcpIHtcblx0ICAgICAgICByZXR1cm4gJ0hUTUxUYWJsZURhdGFDZWxsRWxlbWVudCc7XG5cdCAgICAgIH1cblxuXHQgICAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvI2h0bWx0YWJsZWhlYWRlcmNlbGxlbGVtZW50KVxuXHQgICAgICAgKiBXaGF0V0cgSFRNTCQ0LjkuOSAtIFRoZSBgdGRgIGVsZW1lbnQgLSBJbnRlcmZhY2UgYEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50YFxuXHQgICAgICAgKiBOb3RlOiBNb3N0IGJyb3dzZXJzIGN1cnJlbnRseSBhZGhlciB0byB0aGUgVzNDIERPTSBMZXZlbCAyIHNwZWNcblx0ICAgICAgICogICAgICAgKGh0dHBzOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1IVE1ML2h0bWwuaHRtbCNJRC04MjkxNTA3NSlcblx0ICAgICAgICogICAgICAgd2hpY2ggc3VnZ2VzdHMgdGhhdCBicm93c2VycyBzaG91bGQgdXNlIEhUTUxUYWJsZUNlbGxFbGVtZW50IGZvclxuXHQgICAgICAgKiAgICAgICBib3RoIFREIGFuZCBUSCBlbGVtZW50cy4gV2hhdFdHIHNlcGFyYXRlcyB0aGVzZS5cblx0ICAgICAgICogVGVzdDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RoJykpXG5cdCAgICAgICAqICAtIENocm9tZSA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG5cdCAgICAgICAqICAtIEZpcmVmb3ggPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuXHQgICAgICAgKiAgLSBTYWZhcmkgPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuXHQgICAgICAgKi9cblx0ICAgICAgaWYgKG9iai50YWdOYW1lID09PSAnVEgnKSB7XG5cdCAgICAgICAgcmV0dXJuICdIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudCc7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICBGbG9hdDY0QXJyYXkgICAgICAgeCA2MjUsNjQ0IG9wcy9zZWMgwrExLjU4JSAoODAgcnVucyBzYW1wbGVkKVxuXHQgICogICBGbG9hdDMyQXJyYXkgICAgICAgeCAxLDI3OSw4NTIgb3BzL3NlYyDCsTIuOTElICg3NyBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQzMkFycmF5ICAgICAgICB4IDEsMTc4LDE4NSBvcHMvc2VjIMKxMS45NSUgKDgzIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgVWludDE2QXJyYXkgICAgICAgIHggMSwwMDgsMzgwIG9wcy9zZWMgwrEyLjI1JSAoODAgcnVucyBzYW1wbGVkKVxuXHQgICogICBVaW50OEFycmF5ICAgICAgICAgeCAxLDEyOCwwNDAgb3BzL3NlYyDCsTIuMTElICg4MSBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIEludDMyQXJyYXkgICAgICAgICB4IDEsMTcwLDExOSBvcHMvc2VjIMKxMi44OCUgKDgwIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgSW50MTZBcnJheSAgICAgICAgIHggMSwxNzYsMzQ4IG9wcy9zZWMgwrE1Ljc5JSAoODYgcnVucyBzYW1wbGVkKVxuXHQgICogICBJbnQ4QXJyYXkgICAgICAgICAgeCAxLDA1OCw3MDcgb3BzL3NlYyDCsTQuOTQlICg3NyBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQ4Q2xhbXBlZEFycmF5ICB4IDEsMTEwLDYzMyBvcHMvc2VjIMKxNC4yMCUgKDgwIHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIEZsb2F0NjRBcnJheSAgICAgICB4IDcsMTA1LDY3MSBvcHMvc2VjIMKxMTMuNDclICg2NCBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIEZsb2F0MzJBcnJheSAgICAgICB4IDUsODg3LDkxMiBvcHMvc2VjIMKxMS40NiUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgVWludDMyQXJyYXkgICAgICAgIHggNiw0OTEsNjYxIG9wcy9zZWMgwrExLjc2JSAoNzkgcnVucyBzYW1wbGVkKVxuXHQgICogICBVaW50MTZBcnJheSAgICAgICAgeCA2LDU1OSw3OTUgb3BzL3NlYyDCsTEuNjclICg4MiBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQ4QXJyYXkgICAgICAgICB4IDYsNDYzLDk2NiBvcHMvc2VjIMKxMS40MyUgKDg1IHJ1bnMgc2FtcGxlZClcblx0ICAqICAgSW50MzJBcnJheSAgICAgICAgIHggNSw2NDEsODQxIG9wcy9zZWMgwrEzLjQ5JSAoODEgcnVucyBzYW1wbGVkKVxuXHQgICogICBJbnQxNkFycmF5ICAgICAgICAgeCA2LDU4Myw1MTEgb3BzL3NlYyDCsTEuOTglICg4MCBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIEludDhBcnJheSAgICAgICAgICB4IDYsNjA2LDA3OCBvcHMvc2VjIMKxMS43NCUgKDgxIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgVWludDhDbGFtcGVkQXJyYXkgIHggNiw2MDIsMjI0IG9wcy9zZWMgwrExLjc3JSAoODMgcnVucyBzYW1wbGVkKVxuXHQgICovXG5cdCAgdmFyIHN0cmluZ1RhZyA9IChzeW1ib2xUb1N0cmluZ1RhZ0V4aXN0cyAmJiBvYmpbU3ltYm9sLnRvU3RyaW5nVGFnXSk7XG5cdCAgaWYgKHR5cGVvZiBzdHJpbmdUYWcgPT09ICdzdHJpbmcnKSB7XG5cdCAgICByZXR1cm4gc3RyaW5nVGFnO1xuXHQgIH1cblxuXHQgIHZhciBvYmpQcm90b3R5cGUgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2Yob2JqKTtcblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICByZWdleCBsaXRlcmFsICAgICAgeCAxLDc3MiwzODUgb3BzL3NlYyDCsTEuODUlICg3NyBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIHJlZ2V4IGNvbnN0cnVjdG9yICB4IDIsMTQzLDYzNCBvcHMvc2VjIMKxMi40NiUgKDc4IHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIHJlZ2V4IGxpdGVyYWwgICAgICB4IDMsOTI4LDAwOSBvcHMvc2VjIMKxMC42NSUgKDc4IHJ1bnMgc2FtcGxlZClcblx0ICAqICAgcmVnZXggY29uc3RydWN0b3IgIHggMyw5MzEsMTA4IG9wcy9zZWMgwrEwLjU4JSAoODQgcnVucyBzYW1wbGVkKVxuXHQgICovXG5cdCAgaWYgKG9ialByb3RvdHlwZSA9PT0gUmVnRXhwLnByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdSZWdFeHAnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgKiBQcmU6XG5cdCAgKiAgIGRhdGUgICAgICAgICAgICAgICB4IDIsMTMwLDA3NCBvcHMvc2VjIMKxNC40MiUgKDY4IHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIGRhdGUgICAgICAgICAgICAgICB4IDMsOTUzLDc3OSBvcHMvc2VjIMKxMS4zNSUgKDc3IHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmIChvYmpQcm90b3R5cGUgPT09IERhdGUucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ0RhdGUnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAqIChodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wL2luZGV4Lmh0bWwjc2VjLXByb21pc2UucHJvdG90eXBlLUBAdG9zdHJpbmd0YWcpXG5cdCAgICogRVM2JDI1LjQuNS40IC0gUHJvbWlzZS5wcm90b3R5cGVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiUHJvbWlzZVwiOlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoUHJvbWlzZS5yZXNvbHZlKCkpYGBcblx0ICAgKiAgLSBDaHJvbWUgPD00NyA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxuXHQgICAqICAtIEVkZ2UgPD0yMCA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxuXHQgICAqICAtIEZpcmVmb3ggMjktTGF0ZXN0ID09PSBcIltvYmplY3QgUHJvbWlzZV1cIlxuXHQgICAqICAtIFNhZmFyaSA3LjEtTGF0ZXN0ID09PSBcIltvYmplY3QgUHJvbWlzZV1cIlxuXHQgICAqL1xuXHQgIGlmIChwcm9taXNlRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gUHJvbWlzZS5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnUHJvbWlzZSc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAqIFByZTpcblx0ICAqICAgc2V0ICAgICAgICAgICAgICAgIHggMiwyMjIsMTg2IG9wcy9zZWMgwrExLjMxJSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICogUG9zdDpcblx0ICAqICAgc2V0ICAgICAgICAgICAgICAgIHggNCw1NDUsODc5IG9wcy9zZWMgwrExLjEzJSAoODMgcnVucyBzYW1wbGVkKVxuXHQgICovXG5cdCAgaWYgKHNldEV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IFNldC5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnU2V0Jztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICBtYXAgICAgICAgICAgICAgICAgeCAyLDM5Niw4NDIgb3BzL3NlYyDCsTEuNTklICg4MSBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICBtYXAgICAgICAgICAgICAgICAgeCA0LDE4Myw5NDUgb3BzL3NlYyDCsTYuNTklICg4MiBydW5zIHNhbXBsZWQpXG5cdCAgKi9cblx0ICBpZiAobWFwRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gTWFwLnByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdNYXAnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgKiBQcmU6XG5cdCAgKiAgIHdlYWtzZXQgICAgICAgICAgICB4IDEsMzIzLDIyMCBvcHMvc2VjIMKxMi4xNyUgKDc2IHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIHdlYWtzZXQgICAgICAgICAgICB4IDQsMjM3LDUxMCBvcHMvc2VjIMKxMi4wMSUgKDc3IHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmICh3ZWFrU2V0RXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gV2Vha1NldC5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnV2Vha1NldCc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAqIFByZTpcblx0ICAqICAgd2Vha21hcCAgICAgICAgICAgIHggMSw1MDAsMjYwIG9wcy9zZWMgwrEyLjAyJSAoNzggcnVucyBzYW1wbGVkKVxuXHQgICogUG9zdDpcblx0ICAqICAgd2Vha21hcCAgICAgICAgICAgIHggMyw4ODEsMzg0IG9wcy9zZWMgwrExLjQ1JSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICovXG5cdCAgaWYgKHdlYWtNYXBFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBXZWFrTWFwLnByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdXZWFrTWFwJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy1kYXRhdmlldy5wcm90b3R5cGUtQEB0b3N0cmluZ3RhZylcblx0ICAgKiBFUzYkMjQuMi40LjIxIC0gRGF0YVZpZXcucHJvdG90eXBlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIkRhdGFWaWV3XCI6XG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKDEpKSlgYFxuXHQgICAqICAtIEVkZ2UgPD0xMyA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxuXHQgICAqL1xuXHQgIGlmIChkYXRhVmlld0V4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IERhdGFWaWV3LnByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdEYXRhVmlldyc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICogKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvaW5kZXguaHRtbCNzZWMtJW1hcGl0ZXJhdG9ycHJvdG90eXBlJS1AQHRvc3RyaW5ndGFnKVxuXHQgICAqIEVTNiQyMy4xLjUuMi4yIC0gJU1hcEl0ZXJhdG9yUHJvdG90eXBlJVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJNYXAgSXRlcmF0b3JcIjpcblx0ICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ldyBNYXAoKS5lbnRyaWVzKCkpYGBcblx0ICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKi9cblx0ICBpZiAobWFwRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gbWFwSXRlcmF0b3JQcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnTWFwIEl0ZXJhdG9yJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy0lc2V0aXRlcmF0b3Jwcm90b3R5cGUlLUBAdG9zdHJpbmd0YWcpXG5cdCAgICogRVM2JDIzLjIuNS4yLjIgLSAlU2V0SXRlcmF0b3JQcm90b3R5cGUlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIlNldCBJdGVyYXRvclwiOlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmV3IFNldCgpLmVudHJpZXMoKSlgYFxuXHQgICAqICAtIEVkZ2UgPD0xMyA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxuXHQgICAqL1xuXHQgIGlmIChzZXRFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBzZXRJdGVyYXRvclByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdTZXQgSXRlcmF0b3InO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAqIChodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wL2luZGV4Lmh0bWwjc2VjLSVhcnJheWl0ZXJhdG9ycHJvdG90eXBlJS1AQHRvc3RyaW5ndGFnKVxuXHQgICAqIEVTNiQyMi4xLjUuMi4yIC0gJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIkFycmF5IEl0ZXJhdG9yXCI6XG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChbXVtTeW1ib2wuaXRlcmF0b3JdKCkpYGBcblx0ICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKi9cblx0ICBpZiAoYXJyYXlJdGVyYXRvckV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IGFycmF5SXRlcmF0b3JQcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnQXJyYXkgSXRlcmF0b3InO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAqIChodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wL2luZGV4Lmh0bWwjc2VjLSVzdHJpbmdpdGVyYXRvcnByb3RvdHlwZSUtQEB0b3N0cmluZ3RhZylcblx0ICAgKiBFUzYkMjEuMS41LjIuMiAtICVTdHJpbmdJdGVyYXRvclByb3RvdHlwZSVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiU3RyaW5nIEl0ZXJhdG9yXCI6XG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCgnJ1tTeW1ib2wuaXRlcmF0b3JdKCkpYGBcblx0ICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKi9cblx0ICBpZiAoc3RyaW5nSXRlcmF0b3JFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBzdHJpbmdJdGVyYXRvclByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdTdHJpbmcgSXRlcmF0b3InO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgKiBQcmU6XG5cdCAgKiAgIG9iamVjdCBmcm9tIG51bGwgICB4IDIsNDI0LDMyMCBvcHMvc2VjIMKxMS42NyUgKDc2IHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIG9iamVjdCBmcm9tIG51bGwgICB4IDUsODM4LDAwMCBvcHMvc2VjIMKxMC45OSUgKDg0IHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmIChvYmpQcm90b3R5cGUgPT09IG51bGwpIHtcblx0ICAgIHJldHVybiAnT2JqZWN0Jztcblx0ICB9XG5cblx0ICByZXR1cm4gT2JqZWN0XG5cdCAgICAucHJvdG90eXBlXG5cdCAgICAudG9TdHJpbmdcblx0ICAgIC5jYWxsKG9iailcblx0ICAgIC5zbGljZSh0b1N0cmluZ0xlZnRTbGljZUxlbmd0aCwgdG9TdHJpbmdSaWdodFNsaWNlTGVuZ3RoKTtcblx0fVxuXG5cdHJldHVybiB0eXBlRGV0ZWN0O1xuXG5cdH0pKSk7XG5cdH0pO1xuXG5cdGZ1bmN0aW9uIF9zbGljZWRUb0FycmF5KGFyciwgaSkge1xuXHQgIHJldHVybiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB8fCBfaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB8fCBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkoYXJyLCBpKSB8fCBfbm9uSXRlcmFibGVSZXN0KCk7XG5cdH1cblxuXHRmdW5jdGlvbiBfYXJyYXlXaXRoSG9sZXMoYXJyKSB7XG5cdCAgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgcmV0dXJuIGFycjtcblx0fVxuXG5cdGZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXlMaW1pdChhcnIsIGkpIHtcblx0ICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJ1bmRlZmluZWRcIiB8fCAhKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoYXJyKSkpIHJldHVybjtcblx0ICB2YXIgX2FyciA9IFtdO1xuXHQgIHZhciBfbiA9IHRydWU7XG5cdCAgdmFyIF9kID0gZmFsc2U7XG5cdCAgdmFyIF9lID0gdW5kZWZpbmVkO1xuXG5cdCAgdHJ5IHtcblx0ICAgIGZvciAodmFyIF9pID0gYXJyW1N5bWJvbC5pdGVyYXRvcl0oKSwgX3M7ICEoX24gPSAoX3MgPSBfaS5uZXh0KCkpLmRvbmUpOyBfbiA9IHRydWUpIHtcblx0ICAgICAgX2Fyci5wdXNoKF9zLnZhbHVlKTtcblxuXHQgICAgICBpZiAoaSAmJiBfYXJyLmxlbmd0aCA9PT0gaSkgYnJlYWs7XG5cdCAgICB9XG5cdCAgfSBjYXRjaCAoZXJyKSB7XG5cdCAgICBfZCA9IHRydWU7XG5cdCAgICBfZSA9IGVycjtcblx0ICB9IGZpbmFsbHkge1xuXHQgICAgdHJ5IHtcblx0ICAgICAgaWYgKCFfbiAmJiBfaVtcInJldHVyblwiXSAhPSBudWxsKSBfaVtcInJldHVyblwiXSgpO1xuXHQgICAgfSBmaW5hbGx5IHtcblx0ICAgICAgaWYgKF9kKSB0aHJvdyBfZTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICByZXR1cm4gX2Fycjtcblx0fVxuXG5cdGZ1bmN0aW9uIF91bnN1cHBvcnRlZEl0ZXJhYmxlVG9BcnJheShvLCBtaW5MZW4pIHtcblx0ICBpZiAoIW8pIHJldHVybjtcblx0ICBpZiAodHlwZW9mIG8gPT09IFwic3RyaW5nXCIpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pO1xuXHQgIHZhciBuID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pLnNsaWNlKDgsIC0xKTtcblx0ICBpZiAobiA9PT0gXCJPYmplY3RcIiAmJiBvLmNvbnN0cnVjdG9yKSBuID0gby5jb25zdHJ1Y3Rvci5uYW1lO1xuXHQgIGlmIChuID09PSBcIk1hcFwiIHx8IG4gPT09IFwiU2V0XCIpIHJldHVybiBBcnJheS5mcm9tKG4pO1xuXHQgIGlmIChuID09PSBcIkFyZ3VtZW50c1wiIHx8IC9eKD86VWl8SSludCg/Ojh8MTZ8MzIpKD86Q2xhbXBlZCk/QXJyYXkkLy50ZXN0KG4pKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcblx0fVxuXG5cdGZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7XG5cdCAgaWYgKGxlbiA9PSBudWxsIHx8IGxlbiA+IGFyci5sZW5ndGgpIGxlbiA9IGFyci5sZW5ndGg7XG5cblx0ICBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShsZW4pOyBpIDwgbGVuOyBpKyspIGFycjJbaV0gPSBhcnJbaV07XG5cblx0ICByZXR1cm4gYXJyMjtcblx0fVxuXG5cdGZ1bmN0aW9uIF9ub25JdGVyYWJsZVJlc3QoKSB7XG5cdCAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBkZXN0cnVjdHVyZSBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTtcblx0fVxuXG5cdHZhciBhbnNpQ29sb3JzID0ge1xuXHQgIGJvbGQ6IFsnMScsICcyMiddLFxuXHQgIGRpbTogWycyJywgJzIyJ10sXG5cdCAgaXRhbGljOiBbJzMnLCAnMjMnXSxcblx0ICB1bmRlcmxpbmU6IFsnNCcsICcyNCddLFxuXHQgIC8vIDUgJiA2IGFyZSBibGlua2luZ1xuXHQgIGludmVyc2U6IFsnNycsICcyNyddLFxuXHQgIGhpZGRlbjogWyc4JywgJzI4J10sXG5cdCAgc3RyaWtlOiBbJzknLCAnMjknXSxcblx0ICAvLyAxMC0yMCBhcmUgZm9udHNcblx0ICAvLyAyMS0yOSBhcmUgcmVzZXRzIGZvciAxLTlcblx0ICBibGFjazogWyczMCcsICczOSddLFxuXHQgIHJlZDogWyczMScsICczOSddLFxuXHQgIGdyZWVuOiBbJzMyJywgJzM5J10sXG5cdCAgeWVsbG93OiBbJzMzJywgJzM5J10sXG5cdCAgYmx1ZTogWyczNCcsICczOSddLFxuXHQgIG1hZ2VudGE6IFsnMzUnLCAnMzknXSxcblx0ICBjeWFuOiBbJzM2JywgJzM5J10sXG5cdCAgd2hpdGU6IFsnMzcnLCAnMzknXSxcblx0ICBicmlnaHRibGFjazogWyczMDsxJywgJzM5J10sXG5cdCAgYnJpZ2h0cmVkOiBbJzMxOzEnLCAnMzknXSxcblx0ICBicmlnaHRncmVlbjogWyczMjsxJywgJzM5J10sXG5cdCAgYnJpZ2h0eWVsbG93OiBbJzMzOzEnLCAnMzknXSxcblx0ICBicmlnaHRibHVlOiBbJzM0OzEnLCAnMzknXSxcblx0ICBicmlnaHRtYWdlbnRhOiBbJzM1OzEnLCAnMzknXSxcblx0ICBicmlnaHRjeWFuOiBbJzM2OzEnLCAnMzknXSxcblx0ICBicmlnaHR3aGl0ZTogWyczNzsxJywgJzM5J10sXG5cdCAgZ3JleTogWyc5MCcsICczOSddXG5cdH07XG5cdHZhciBzdHlsZXMgPSB7XG5cdCAgc3BlY2lhbDogJ2N5YW4nLFxuXHQgIG51bWJlcjogJ3llbGxvdycsXG5cdCAgYm9vbGVhbjogJ3llbGxvdycsXG5cdCAgdW5kZWZpbmVkOiAnZ3JleScsXG5cdCAgbnVsbDogJ2JvbGQnLFxuXHQgIHN0cmluZzogJ2dyZWVuJyxcblx0ICBzeW1ib2w6ICdncmVlbicsXG5cdCAgZGF0ZTogJ21hZ2VudGEnLFxuXHQgIHJlZ2V4cDogJ3JlZCdcblx0fTtcblx0dmFyIHRydW5jYXRvciA9ICfigKYnO1xuXG5cdGZ1bmN0aW9uIGNvbG9yaXNlKHZhbHVlLCBzdHlsZVR5cGUpIHtcblx0ICB2YXIgY29sb3IgPSBhbnNpQ29sb3JzW3N0eWxlc1tzdHlsZVR5cGVdXSB8fCBhbnNpQ29sb3JzW3N0eWxlVHlwZV07XG5cblx0ICBpZiAoIWNvbG9yKSB7XG5cdCAgICByZXR1cm4gU3RyaW5nKHZhbHVlKTtcblx0ICB9XG5cblx0ICByZXR1cm4gXCJcXHgxQltcIi5jb25jYXQoY29sb3JbMF0sIFwibVwiKS5jb25jYXQoU3RyaW5nKHZhbHVlKSwgXCJcXHgxQltcIikuY29uY2F0KGNvbG9yWzFdLCBcIm1cIik7XG5cdH1cblxuXHRmdW5jdGlvbiBub3JtYWxpc2VPcHRpb25zKCkge1xuXHQgIHZhciBfcmVmID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiB7fSxcblx0ICAgICAgX3JlZiRzaG93SGlkZGVuID0gX3JlZi5zaG93SGlkZGVuLFxuXHQgICAgICBzaG93SGlkZGVuID0gX3JlZiRzaG93SGlkZGVuID09PSB2b2lkIDAgPyBmYWxzZSA6IF9yZWYkc2hvd0hpZGRlbixcblx0ICAgICAgX3JlZiRkZXB0aCA9IF9yZWYuZGVwdGgsXG5cdCAgICAgIGRlcHRoID0gX3JlZiRkZXB0aCA9PT0gdm9pZCAwID8gMiA6IF9yZWYkZGVwdGgsXG5cdCAgICAgIF9yZWYkY29sb3JzID0gX3JlZi5jb2xvcnMsXG5cdCAgICAgIGNvbG9ycyA9IF9yZWYkY29sb3JzID09PSB2b2lkIDAgPyBmYWxzZSA6IF9yZWYkY29sb3JzLFxuXHQgICAgICBfcmVmJGN1c3RvbUluc3BlY3QgPSBfcmVmLmN1c3RvbUluc3BlY3QsXG5cdCAgICAgIGN1c3RvbUluc3BlY3QgPSBfcmVmJGN1c3RvbUluc3BlY3QgPT09IHZvaWQgMCA/IHRydWUgOiBfcmVmJGN1c3RvbUluc3BlY3QsXG5cdCAgICAgIF9yZWYkc2hvd1Byb3h5ID0gX3JlZi5zaG93UHJveHksXG5cdCAgICAgIHNob3dQcm94eSA9IF9yZWYkc2hvd1Byb3h5ID09PSB2b2lkIDAgPyBmYWxzZSA6IF9yZWYkc2hvd1Byb3h5LFxuXHQgICAgICBfcmVmJG1heEFycmF5TGVuZ3RoID0gX3JlZi5tYXhBcnJheUxlbmd0aCxcblx0ICAgICAgbWF4QXJyYXlMZW5ndGggPSBfcmVmJG1heEFycmF5TGVuZ3RoID09PSB2b2lkIDAgPyBJbmZpbml0eSA6IF9yZWYkbWF4QXJyYXlMZW5ndGgsXG5cdCAgICAgIF9yZWYkYnJlYWtMZW5ndGggPSBfcmVmLmJyZWFrTGVuZ3RoLFxuXHQgICAgICBicmVha0xlbmd0aCA9IF9yZWYkYnJlYWtMZW5ndGggPT09IHZvaWQgMCA/IEluZmluaXR5IDogX3JlZiRicmVha0xlbmd0aCxcblx0ICAgICAgX3JlZiRzZWVuID0gX3JlZi5zZWVuLFxuXHQgICAgICBzZWVuID0gX3JlZiRzZWVuID09PSB2b2lkIDAgPyBbXSA6IF9yZWYkc2Vlbixcblx0ICAgICAgX3JlZiR0cnVuY2F0ZSA9IF9yZWYudHJ1bmNhdGUsXG5cdCAgICAgIHRydW5jYXRlID0gX3JlZiR0cnVuY2F0ZSA9PT0gdm9pZCAwID8gSW5maW5pdHkgOiBfcmVmJHRydW5jYXRlLFxuXHQgICAgICBfcmVmJHN0eWxpemUgPSBfcmVmLnN0eWxpemUsXG5cdCAgICAgIHN0eWxpemUgPSBfcmVmJHN0eWxpemUgPT09IHZvaWQgMCA/IFN0cmluZyA6IF9yZWYkc3R5bGl6ZTtcblxuXHQgIHZhciBvcHRpb25zID0ge1xuXHQgICAgc2hvd0hpZGRlbjogQm9vbGVhbihzaG93SGlkZGVuKSxcblx0ICAgIGRlcHRoOiBOdW1iZXIoZGVwdGgpLFxuXHQgICAgY29sb3JzOiBCb29sZWFuKGNvbG9ycyksXG5cdCAgICBjdXN0b21JbnNwZWN0OiBCb29sZWFuKGN1c3RvbUluc3BlY3QpLFxuXHQgICAgc2hvd1Byb3h5OiBCb29sZWFuKHNob3dQcm94eSksXG5cdCAgICBtYXhBcnJheUxlbmd0aDogTnVtYmVyKG1heEFycmF5TGVuZ3RoKSxcblx0ICAgIGJyZWFrTGVuZ3RoOiBOdW1iZXIoYnJlYWtMZW5ndGgpLFxuXHQgICAgdHJ1bmNhdGU6IE51bWJlcih0cnVuY2F0ZSksXG5cdCAgICBzZWVuOiBzZWVuLFxuXHQgICAgc3R5bGl6ZTogc3R5bGl6ZVxuXHQgIH07XG5cblx0ICBpZiAob3B0aW9ucy5jb2xvcnMpIHtcblx0ICAgIG9wdGlvbnMuc3R5bGl6ZSA9IGNvbG9yaXNlO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zO1xuXHR9XG5cdGZ1bmN0aW9uIHRydW5jYXRlKHN0cmluZywgbGVuZ3RoKSB7XG5cdCAgdmFyIHRhaWwgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHRydW5jYXRvcjtcblx0ICBzdHJpbmcgPSBTdHJpbmcoc3RyaW5nKTtcblx0ICB2YXIgdGFpbExlbmd0aCA9IHRhaWwubGVuZ3RoO1xuXHQgIHZhciBzdHJpbmdMZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuXG5cdCAgaWYgKHRhaWxMZW5ndGggPiBsZW5ndGggJiYgc3RyaW5nTGVuZ3RoID4gdGFpbExlbmd0aCkge1xuXHQgICAgcmV0dXJuIHRhaWw7XG5cdCAgfVxuXG5cdCAgaWYgKHN0cmluZ0xlbmd0aCA+IGxlbmd0aCAmJiBzdHJpbmdMZW5ndGggPiB0YWlsTGVuZ3RoKSB7XG5cdCAgICByZXR1cm4gXCJcIi5jb25jYXQoc3RyaW5nLnNsaWNlKDAsIGxlbmd0aCAtIHRhaWxMZW5ndGgpKS5jb25jYXQodGFpbCk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIHN0cmluZztcblx0fSAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RMaXN0KGxpc3QsIG9wdGlvbnMsIGluc3BlY3RJdGVtKSB7XG5cdCAgdmFyIHNlcGFyYXRvciA9IGFyZ3VtZW50cy5sZW5ndGggPiAzICYmIGFyZ3VtZW50c1szXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzNdIDogJywgJztcblx0ICBpbnNwZWN0SXRlbSA9IGluc3BlY3RJdGVtIHx8IG9wdGlvbnMuaW5zcGVjdDtcblx0ICB2YXIgc2l6ZSA9IGxpc3QubGVuZ3RoO1xuXHQgIGlmIChzaXplID09PSAwKSByZXR1cm4gJyc7XG5cdCAgdmFyIG9yaWdpbmFsTGVuZ3RoID0gb3B0aW9ucy50cnVuY2F0ZTtcblx0ICB2YXIgb3V0cHV0ID0gJyc7XG5cdCAgdmFyIHBlZWsgPSAnJztcblx0ICB2YXIgdHJ1bmNhdGVkID0gJyc7XG5cblx0ICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkgKz0gMSkge1xuXHQgICAgdmFyIGxhc3QgPSBpICsgMSA9PT0gbGlzdC5sZW5ndGg7XG5cdCAgICB2YXIgc2Vjb25kVG9MYXN0ID0gaSArIDIgPT09IGxpc3QubGVuZ3RoO1xuXHQgICAgdHJ1bmNhdGVkID0gXCJcIi5jb25jYXQodHJ1bmNhdG9yLCBcIihcIikuY29uY2F0KGxpc3QubGVuZ3RoIC0gaSwgXCIpXCIpO1xuXHQgICAgdmFyIHZhbHVlID0gbGlzdFtpXTsgLy8gSWYgdGhlcmUgaXMgbW9yZSB0aGFuIG9uZSByZW1haW5pbmcgd2UgbmVlZCB0byBhY2NvdW50IGZvciBhIHNlcGFyYXRvciBvZiBgLCBgXG5cblx0ICAgIG9wdGlvbnMudHJ1bmNhdGUgPSBvcmlnaW5hbExlbmd0aCAtIG91dHB1dC5sZW5ndGggLSAobGFzdCA/IDAgOiBzZXBhcmF0b3IubGVuZ3RoKTtcblx0ICAgIHZhciBzdHJpbmcgPSBwZWVrIHx8IGluc3BlY3RJdGVtKHZhbHVlLCBvcHRpb25zKSArIChsYXN0ID8gJycgOiBzZXBhcmF0b3IpO1xuXHQgICAgdmFyIG5leHRMZW5ndGggPSBvdXRwdXQubGVuZ3RoICsgc3RyaW5nLmxlbmd0aDtcblx0ICAgIHZhciB0cnVuY2F0ZWRMZW5ndGggPSBuZXh0TGVuZ3RoICsgdHJ1bmNhdGVkLmxlbmd0aDsgLy8gSWYgdGhpcyBpcyB0aGUgbGFzdCBlbGVtZW50LCBhbmQgYWRkaW5nIGl0IHdvdWxkXG5cdCAgICAvLyB0YWtlIHVzIG92ZXIgbGVuZ3RoLCBidXQgYWRkaW5nIHRoZSB0cnVuY2F0b3Igd291bGRuJ3QgLSB0aGVuIGJyZWFrIG5vd1xuXG5cdCAgICBpZiAobGFzdCAmJiBuZXh0TGVuZ3RoID4gb3JpZ2luYWxMZW5ndGggJiYgb3V0cHV0Lmxlbmd0aCArIHRydW5jYXRlZC5sZW5ndGggPD0gb3JpZ2luYWxMZW5ndGgpIHtcblx0ICAgICAgYnJlYWs7XG5cdCAgICB9IC8vIElmIHRoaXMgaXNuJ3QgdGhlIGxhc3Qgb3Igc2Vjb25kIHRvIGxhc3QgZWxlbWVudCB0byBzY2FuLFxuXHQgICAgLy8gYnV0IHRoZSBzdHJpbmcgaXMgYWxyZWFkeSBvdmVyIGxlbmd0aCB0aGVuIGJyZWFrIGhlcmVcblxuXG5cdCAgICBpZiAoIWxhc3QgJiYgIXNlY29uZFRvTGFzdCAmJiB0cnVuY2F0ZWRMZW5ndGggPiBvcmlnaW5hbExlbmd0aCkge1xuXHQgICAgICBicmVhaztcblx0ICAgIH0gLy8gUGVlayBhdCB0aGUgbmV4dCBzdHJpbmcgdG8gZGV0ZXJtaW5lIGlmIHdlIHNob3VsZFxuXHQgICAgLy8gYnJlYWsgZWFybHkgYmVmb3JlIGFkZGluZyB0aGlzIGl0ZW0gdG8gdGhlIG91dHB1dFxuXG5cblx0ICAgIHBlZWsgPSBsYXN0ID8gJycgOiBpbnNwZWN0SXRlbShsaXN0W2kgKyAxXSwgb3B0aW9ucykgKyAoc2Vjb25kVG9MYXN0ID8gJycgOiBzZXBhcmF0b3IpOyAvLyBJZiB3ZSBoYXZlIG9uZSBlbGVtZW50IGxlZnQsIGJ1dCB0aGlzIGVsZW1lbnQgYW5kXG5cdCAgICAvLyB0aGUgbmV4dCB0YWtlcyBvdmVyIGxlbmd0aCwgdGhlIGJyZWFrIGVhcmx5XG5cblx0ICAgIGlmICghbGFzdCAmJiBzZWNvbmRUb0xhc3QgJiYgdHJ1bmNhdGVkTGVuZ3RoID4gb3JpZ2luYWxMZW5ndGggJiYgbmV4dExlbmd0aCArIHBlZWsubGVuZ3RoID4gb3JpZ2luYWxMZW5ndGgpIHtcblx0ICAgICAgYnJlYWs7XG5cdCAgICB9XG5cblx0ICAgIG91dHB1dCArPSBzdHJpbmc7IC8vIElmIHRoZSBuZXh0IGVsZW1lbnQgdGFrZXMgdXMgdG8gbGVuZ3RoIC1cblx0ICAgIC8vIGJ1dCB0aGVyZSBhcmUgbW9yZSBhZnRlciB0aGF0LCB0aGVuIHdlIHNob3VsZCB0cnVuY2F0ZSBub3dcblxuXHQgICAgaWYgKCFsYXN0ICYmICFzZWNvbmRUb0xhc3QgJiYgbmV4dExlbmd0aCArIHBlZWsubGVuZ3RoID49IG9yaWdpbmFsTGVuZ3RoKSB7XG5cdCAgICAgIHRydW5jYXRlZCA9IFwiXCIuY29uY2F0KHRydW5jYXRvciwgXCIoXCIpLmNvbmNhdChsaXN0Lmxlbmd0aCAtIGkgLSAxLCBcIilcIik7XG5cdCAgICAgIGJyZWFrO1xuXHQgICAgfVxuXG5cdCAgICB0cnVuY2F0ZWQgPSAnJztcblx0ICB9XG5cblx0ICByZXR1cm4gXCJcIi5jb25jYXQob3V0cHV0KS5jb25jYXQodHJ1bmNhdGVkKTtcblx0fVxuXHRmdW5jdGlvbiBpbnNwZWN0UHJvcGVydHkoX3JlZjIsIG9wdGlvbnMpIHtcblx0ICB2YXIgX3JlZjMgPSBfc2xpY2VkVG9BcnJheShfcmVmMiwgMiksXG5cdCAgICAgIGtleSA9IF9yZWYzWzBdLFxuXHQgICAgICB2YWx1ZSA9IF9yZWYzWzFdO1xuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSAyO1xuXG5cdCAgaWYgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnICYmIHR5cGVvZiBrZXkgIT09ICdudW1iZXInKSB7XG5cdCAgICBrZXkgPSBcIltcIi5jb25jYXQob3B0aW9ucy5pbnNwZWN0KGtleSwgb3B0aW9ucyksIFwiXVwiKTtcblx0ICB9XG5cblx0ICBvcHRpb25zLnRydW5jYXRlIC09IGtleS5sZW5ndGg7XG5cdCAgdmFsdWUgPSBvcHRpb25zLmluc3BlY3QodmFsdWUsIG9wdGlvbnMpO1xuXHQgIHJldHVybiBcIlwiLmNvbmNhdChrZXksIFwiOiBcIikuY29uY2F0KHZhbHVlKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RBcnJheShhcnJheSwgb3B0aW9ucykge1xuXHQgIC8vIE9iamVjdC5rZXlzIHdpbGwgYWx3YXlzIG91dHB1dCB0aGUgQXJyYXkgaW5kaWNlcyBmaXJzdCwgc28gd2UgY2FuIHNsaWNlIGJ5XG5cdCAgLy8gYGFycmF5Lmxlbmd0aGAgdG8gZ2V0IG5vbi1pbmRleCBwcm9wZXJ0aWVzXG5cdCAgdmFyIG5vbkluZGV4UHJvcGVydGllcyA9IE9iamVjdC5rZXlzKGFycmF5KS5zbGljZShhcnJheS5sZW5ndGgpO1xuXHQgIGlmICghYXJyYXkubGVuZ3RoICYmICFub25JbmRleFByb3BlcnRpZXMubGVuZ3RoKSByZXR1cm4gJ1tdJztcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IDQ7XG5cdCAgdmFyIGxpc3RDb250ZW50cyA9IGluc3BlY3RMaXN0KGFycmF5LCBvcHRpb25zKTtcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IGxpc3RDb250ZW50cy5sZW5ndGg7XG5cdCAgdmFyIHByb3BlcnR5Q29udGVudHMgPSAnJztcblxuXHQgIGlmIChub25JbmRleFByb3BlcnRpZXMubGVuZ3RoKSB7XG5cdCAgICBwcm9wZXJ0eUNvbnRlbnRzID0gaW5zcGVjdExpc3Qobm9uSW5kZXhQcm9wZXJ0aWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICAgIHJldHVybiBba2V5LCBhcnJheVtrZXldXTtcblx0ICAgIH0pLCBvcHRpb25zLCBpbnNwZWN0UHJvcGVydHkpO1xuXHQgIH1cblxuXHQgIHJldHVybiBcIlsgXCIuY29uY2F0KGxpc3RDb250ZW50cykuY29uY2F0KHByb3BlcnR5Q29udGVudHMgPyBcIiwgXCIuY29uY2F0KHByb3BlcnR5Q29udGVudHMpIDogJycsIFwiIF1cIik7XG5cdH1cblxuXHQvKiAhXG5cdCAqIENoYWkgLSBnZXRGdW5jTmFtZSB1dGlsaXR5XG5cdCAqIENvcHlyaWdodChjKSAyMDEyLTIwMTYgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG5cdCAqIE1JVCBMaWNlbnNlZFxuXHQgKi9cblxuXHQvKipcblx0ICogIyMjIC5nZXRGdW5jTmFtZShjb25zdHJ1Y3RvckZuKVxuXHQgKlxuXHQgKiBSZXR1cm5zIHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24uXG5cdCAqIFdoZW4gYSBub24tZnVuY3Rpb24gaW5zdGFuY2UgaXMgcGFzc2VkLCByZXR1cm5zIGBudWxsYC5cblx0ICogVGhpcyBhbHNvIGluY2x1ZGVzIGEgcG9seWZpbGwgZnVuY3Rpb24gaWYgYGFGdW5jLm5hbWVgIGlzIG5vdCBkZWZpbmVkLlxuXHQgKlxuXHQgKiBAbmFtZSBnZXRGdW5jTmFtZVxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmdW5jdFxuXHQgKiBAbmFtZXNwYWNlIFV0aWxzXG5cdCAqIEBhcGkgcHVibGljXG5cdCAqL1xuXG5cdHZhciB0b1N0cmluZyA9IEZ1bmN0aW9uLnByb3RvdHlwZS50b1N0cmluZztcblx0dmFyIGZ1bmN0aW9uTmFtZU1hdGNoID0gL1xccypmdW5jdGlvbig/Olxcc3xcXHMqXFwvXFwqW14oPzoqXFwvKV0rXFwqXFwvXFxzKikqKFteXFxzXFwoXFwvXSspLztcblx0ZnVuY3Rpb24gZ2V0RnVuY05hbWUoYUZ1bmMpIHtcblx0ICBpZiAodHlwZW9mIGFGdW5jICE9PSAnZnVuY3Rpb24nKSB7XG5cdCAgICByZXR1cm4gbnVsbDtcblx0ICB9XG5cblx0ICB2YXIgbmFtZSA9ICcnO1xuXHQgIGlmICh0eXBlb2YgRnVuY3Rpb24ucHJvdG90eXBlLm5hbWUgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBhRnVuYy5uYW1lID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgLy8gSGVyZSB3ZSBydW4gYSBwb2x5ZmlsbCBpZiBGdW5jdGlvbiBkb2VzIG5vdCBzdXBwb3J0IHRoZSBgbmFtZWAgcHJvcGVydHkgYW5kIGlmIGFGdW5jLm5hbWUgaXMgbm90IGRlZmluZWRcblx0ICAgIHZhciBtYXRjaCA9IHRvU3RyaW5nLmNhbGwoYUZ1bmMpLm1hdGNoKGZ1bmN0aW9uTmFtZU1hdGNoKTtcblx0ICAgIGlmIChtYXRjaCkge1xuXHQgICAgICBuYW1lID0gbWF0Y2hbMV07XG5cdCAgICB9XG5cdCAgfSBlbHNlIHtcblx0ICAgIC8vIElmIHdlJ3ZlIGdvdCBhIGBuYW1lYCBwcm9wZXJ0eSB3ZSBqdXN0IHVzZSBpdFxuXHQgICAgbmFtZSA9IGFGdW5jLm5hbWU7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIG5hbWU7XG5cdH1cblxuXHR2YXIgZ2V0RnVuY05hbWVfMSA9IGdldEZ1bmNOYW1lO1xuXG5cdHZhciB0b1N0cmluZ1RhZyA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZyA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IGZhbHNlO1xuXG5cdHZhciBnZXRBcnJheU5hbWUgPSBmdW5jdGlvbiBnZXRBcnJheU5hbWUoYXJyYXkpIHtcblx0ICAvLyBXZSBuZWVkIHRvIHNwZWNpYWwgY2FzZSBOb2RlLmpzJyBCdWZmZXJzLCB3aGljaCByZXBvcnQgdG8gYmUgVWludDhBcnJheVxuXHQgIGlmICh0eXBlb2YgQnVmZmVyID09PSAnZnVuY3Rpb24nICYmIGFycmF5IGluc3RhbmNlb2YgQnVmZmVyKSB7XG5cdCAgICByZXR1cm4gJ0J1ZmZlcic7XG5cdCAgfVxuXG5cdCAgaWYgKHRvU3RyaW5nVGFnICYmIHRvU3RyaW5nVGFnIGluIGFycmF5KSB7XG5cdCAgICByZXR1cm4gYXJyYXlbdG9TdHJpbmdUYWddO1xuXHQgIH1cblxuXHQgIHJldHVybiBnZXRGdW5jTmFtZV8xKGFycmF5LmNvbnN0cnVjdG9yKTtcblx0fTtcblxuXHRmdW5jdGlvbiBpbnNwZWN0VHlwZWRBcnJheShhcnJheSwgb3B0aW9ucykge1xuXHQgIHZhciBuYW1lID0gZ2V0QXJyYXlOYW1lKGFycmF5KTtcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IG5hbWUubGVuZ3RoICsgNDsgLy8gT2JqZWN0LmtleXMgd2lsbCBhbHdheXMgb3V0cHV0IHRoZSBBcnJheSBpbmRpY2VzIGZpcnN0LCBzbyB3ZSBjYW4gc2xpY2UgYnlcblx0ICAvLyBgYXJyYXkubGVuZ3RoYCB0byBnZXQgbm9uLWluZGV4IHByb3BlcnRpZXNcblxuXHQgIHZhciBub25JbmRleFByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhhcnJheSkuc2xpY2UoYXJyYXkubGVuZ3RoKTtcblx0ICBpZiAoIWFycmF5Lmxlbmd0aCAmJiAhbm9uSW5kZXhQcm9wZXJ0aWVzLmxlbmd0aCkgcmV0dXJuIFwiXCIuY29uY2F0KG5hbWUsIFwiW11cIik7IC8vIEFzIHdlIGtub3cgVHlwZWRBcnJheXMgb25seSBjb250YWluIFVuc2lnbmVkIEludGVnZXJzLCB3ZSBjYW4gc2tpcCBpbnNwZWN0aW5nIGVhY2ggb25lIGFuZCBzaW1wbHlcblx0ICAvLyBzdHlsaXNlIHRoZSB0b1N0cmluZygpIHZhbHVlIG9mIHRoZW1cblxuXHQgIHZhciBvdXRwdXQgPSAnJztcblxuXHQgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyYXkubGVuZ3RoOyBpKyspIHtcblx0ICAgIHZhciBzdHJpbmcgPSBcIlwiLmNvbmNhdChvcHRpb25zLnN0eWxpemUodHJ1bmNhdGUoYXJyYXlbaV0sIG9wdGlvbnMudHJ1bmNhdGUpLCAnbnVtYmVyJykpLmNvbmNhdChhcnJheVtpXSA9PT0gYXJyYXkubGVuZ3RoID8gJycgOiAnLCAnKTtcblx0ICAgIG9wdGlvbnMudHJ1bmNhdGUgLT0gc3RyaW5nLmxlbmd0aDtcblxuXHQgICAgaWYgKGFycmF5W2ldICE9PSBhcnJheS5sZW5ndGggJiYgb3B0aW9ucy50cnVuY2F0ZSA8PSAzKSB7XG5cdCAgICAgIG91dHB1dCArPSBcIlwiLmNvbmNhdCh0cnVuY2F0b3IsIFwiKFwiKS5jb25jYXQoYXJyYXkubGVuZ3RoIC0gYXJyYXlbaV0gKyAxLCBcIilcIik7XG5cdCAgICAgIGJyZWFrO1xuXHQgICAgfVxuXG5cdCAgICBvdXRwdXQgKz0gc3RyaW5nO1xuXHQgIH1cblxuXHQgIHZhciBwcm9wZXJ0eUNvbnRlbnRzID0gJyc7XG5cblx0ICBpZiAobm9uSW5kZXhQcm9wZXJ0aWVzLmxlbmd0aCkge1xuXHQgICAgcHJvcGVydHlDb250ZW50cyA9IGluc3BlY3RMaXN0KG5vbkluZGV4UHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgICByZXR1cm4gW2tleSwgYXJyYXlba2V5XV07XG5cdCAgICB9KSwgb3B0aW9ucywgaW5zcGVjdFByb3BlcnR5KTtcblx0ICB9XG5cblx0ICByZXR1cm4gXCJcIi5jb25jYXQobmFtZSwgXCJbIFwiKS5jb25jYXQob3V0cHV0KS5jb25jYXQocHJvcGVydHlDb250ZW50cyA/IFwiLCBcIi5jb25jYXQocHJvcGVydHlDb250ZW50cykgOiAnJywgXCIgXVwiKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3REYXRlKGRhdGVPYmplY3QsIG9wdGlvbnMpIHtcblx0ICAvLyBJZiB3ZSBuZWVkIHRvIC0gdHJ1bmNhdGUgdGhlIHRpbWUgcG9ydGlvbiwgYnV0IG5ldmVyIHRoZSBkYXRlXG5cdCAgdmFyIHNwbGl0ID0gZGF0ZU9iamVjdC50b0pTT04oKS5zcGxpdCgnVCcpO1xuXHQgIHZhciBkYXRlID0gc3BsaXRbMF07XG5cdCAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZShcIlwiLmNvbmNhdChkYXRlLCBcIlRcIikuY29uY2F0KHRydW5jYXRlKHNwbGl0WzFdLCBvcHRpb25zLnRydW5jYXRlIC0gZGF0ZS5sZW5ndGggLSAxKSksICdkYXRlJyk7XG5cdH1cblxuXHR2YXIgdG9TdHJpbmckMSA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cblx0dmFyIGdldEZ1bmN0aW9uTmFtZSA9IGZ1bmN0aW9uKGZuKSB7XG5cdCAgaWYgKHRvU3RyaW5nJDEuY2FsbChmbikgIT09ICdbb2JqZWN0IEZ1bmN0aW9uXScpIHJldHVybiBudWxsXG5cdCAgaWYgKGZuLm5hbWUpIHJldHVybiBmbi5uYW1lXG5cdCAgdmFyIG5hbWUgPSAvXlxccypmdW5jdGlvblxccyooW15cXChdKikvaW0uZXhlYyhmbi50b1N0cmluZygpKVsxXTtcblx0ICByZXR1cm4gbmFtZSB8fCAnYW5vbnltb3VzJ1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGluc3BlY3RGdW5jdGlvbihmdW5jLCBvcHRpb25zKSB7XG5cdCAgdmFyIG5hbWUgPSBnZXRGdW5jdGlvbk5hbWUoZnVuYyk7XG5cblx0ICBpZiAobmFtZSA9PT0gJ2Fub255bW91cycpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ1tGdW5jdGlvbl0nLCAnc3BlY2lhbCcpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCJbRnVuY3Rpb24gXCIuY29uY2F0KHRydW5jYXRlKG5hbWUsIG9wdGlvbnMudHJ1bmNhdGUgLSAxMSksIFwiXVwiKSwgJ3NwZWNpYWwnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RNYXBFbnRyeShfcmVmLCBvcHRpb25zKSB7XG5cdCAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMiksXG5cdCAgICAgIGtleSA9IF9yZWYyWzBdLFxuXHQgICAgICB2YWx1ZSA9IF9yZWYyWzFdO1xuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSA0O1xuXHQgIGtleSA9IG9wdGlvbnMuaW5zcGVjdChrZXksIG9wdGlvbnMpO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0ga2V5Lmxlbmd0aDtcblx0ICB2YWx1ZSA9IG9wdGlvbnMuaW5zcGVjdCh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KGtleSwgXCIgPT4gXCIpLmNvbmNhdCh2YWx1ZSk7XG5cdH0gLy8gSUUxMSBkb2Vzbid0IHN1cHBvcnQgYG1hcC5lbnRyaWVzKClgXG5cblxuXHRmdW5jdGlvbiBtYXBUb0VudHJpZXMobWFwKSB7XG5cdCAgdmFyIGVudHJpZXMgPSBbXTtcblx0ICBtYXAuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuXHQgICAgZW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSk7XG5cdCAgfSk7XG5cdCAgcmV0dXJuIGVudHJpZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0TWFwKG1hcCwgb3B0aW9ucykge1xuXHQgIHZhciBzaXplID0gbWFwLnNpemUgLSAxO1xuXG5cdCAgaWYgKHNpemUgPD0gMCkge1xuXHQgICAgcmV0dXJuICdNYXB7fSc7XG5cdCAgfVxuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSA3O1xuXHQgIHJldHVybiBcIk1hcHsgXCIuY29uY2F0KGluc3BlY3RMaXN0KG1hcFRvRW50cmllcyhtYXApLCBvcHRpb25zLCBpbnNwZWN0TWFwRW50cnkpLCBcIiB9XCIpO1xuXHR9XG5cblx0dmFyIGlzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIChpKSB7XG5cdCAgcmV0dXJuIGkgIT09IGk7XG5cdH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG5cblxuXHRmdW5jdGlvbiBpbnNwZWN0TnVtYmVyKG51bWJlciwgb3B0aW9ucykge1xuXHQgIGlmIChpc05hTihudW1iZXIpKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKCdOYU4nLCAnbnVtYmVyJyk7XG5cdCAgfVxuXG5cdCAgaWYgKG51bWJlciA9PT0gSW5maW5pdHkpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ0luZmluaXR5JywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIGlmIChudW1iZXIgPT09IC1JbmZpbml0eSkge1xuXHQgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZSgnLUluZmluaXR5JywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIGlmIChudW1iZXIgPT09IDApIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoMSAvIG51bWJlciA9PT0gSW5maW5pdHkgPyAnKzAnIDogJy0wJywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUodHJ1bmNhdGUobnVtYmVyLCBvcHRpb25zLnRydW5jYXRlKSwgJ251bWJlcicpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zcGVjdFJlZ0V4cCh2YWx1ZSwgb3B0aW9ucykge1xuXHQgIHZhciBmbGFncyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy8nKVsyXTtcblx0ICB2YXIgc291cmNlTGVuZ3RoID0gb3B0aW9ucy50cnVuY2F0ZSAtICgyICsgZmxhZ3MubGVuZ3RoKTtcblx0ICB2YXIgc291cmNlID0gdmFsdWUuc291cmNlO1xuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCIvXCIuY29uY2F0KHRydW5jYXRlKHNvdXJjZSwgc291cmNlTGVuZ3RoKSwgXCIvXCIpLmNvbmNhdChmbGFncyksICdyZWdleHAnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFycmF5RnJvbVNldChzZXQpIHtcblx0ICB2YXIgdmFsdWVzID0gW107XG5cdCAgc2V0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdCAgfSk7XG5cdCAgcmV0dXJuIHZhbHVlcztcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RTZXQoc2V0LCBvcHRpb25zKSB7XG5cdCAgaWYgKHNldC5zaXplID09PSAwKSByZXR1cm4gJ1NldHt9Jztcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IDc7XG5cdCAgcmV0dXJuIFwiU2V0eyBcIi5jb25jYXQoaW5zcGVjdExpc3QoYXJyYXlGcm9tU2V0KHNldCksIG9wdGlvbnMpLCBcIiB9XCIpO1xuXHR9XG5cblx0dmFyIHN0cmluZ0VzY2FwZUNoYXJzID0gbmV3IFJlZ0V4cChcIlsnXFxcXHUwMDAwLVxcXFx1MDAxZlxcXFx1MDA3Zi1cXFxcdTAwOWZcXFxcdTAwYWRcXFxcdTA2MDAtXFxcXHUwNjA0XFxcXHUwNzBmXFxcXHUxN2I0XFxcXHUxN2I1XCIgKyBcIlxcXFx1MjAwYy1cXFxcdTIwMGZcXFxcdTIwMjgtXFxcXHUyMDJmXFxcXHUyMDYwLVxcXFx1MjA2ZlxcXFx1ZmVmZlxcXFx1ZmZmMC1cXFxcdWZmZmZdXCIsICdnJyk7XG5cdHZhciBlc2NhcGVDaGFyYWN0ZXJzID0ge1xuXHQgICdcXGInOiAnXFxcXGInLFxuXHQgICdcXHQnOiAnXFxcXHQnLFxuXHQgICdcXG4nOiAnXFxcXG4nLFxuXHQgICdcXGYnOiAnXFxcXGYnLFxuXHQgICdcXHInOiAnXFxcXHInLFxuXHQgIFwiJ1wiOiBcIlxcXFwnXCIsXG5cdCAgJ1xcXFwnOiAnXFxcXFxcXFwnXG5cdH07XG5cdHZhciBoZXggPSAxNjtcblx0dmFyIHVuaWNvZGVMZW5ndGggPSA0O1xuXG5cdGZ1bmN0aW9uIGVzY2FwZShjaGFyKSB7XG5cdCAgcmV0dXJuIGVzY2FwZUNoYXJhY3RlcnNbY2hhcl0gfHwgXCJcXFxcdVwiLmNvbmNhdChcIjAwMDBcIi5jb25jYXQoY2hhci5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKGhleCkpLnNsaWNlKC11bmljb2RlTGVuZ3RoKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0U3RyaW5nKHN0cmluZywgb3B0aW9ucykge1xuXHQgIGlmIChzdHJpbmdFc2NhcGVDaGFycy50ZXN0KHN0cmluZykpIHtcblx0ICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKHN0cmluZ0VzY2FwZUNoYXJzLCBlc2NhcGUpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCInXCIuY29uY2F0KHRydW5jYXRlKHN0cmluZywgb3B0aW9ucy50cnVuY2F0ZSAtIDIpLCBcIidcIiksICdzdHJpbmcnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RTeW1ib2wodmFsdWUpIHtcblx0ICBpZiAoJ2Rlc2NyaXB0aW9uJyBpbiBTeW1ib2wucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gXCJTeW1ib2woXCIuY29uY2F0KHZhbHVlLmRlc2NyaXB0aW9uLCBcIilcIik7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG5cdH1cblxuXHR2YXIgZ2V0UHJvbWlzZVZhbHVlID0gZnVuY3Rpb24gZ2V0UHJvbWlzZVZhbHVlKCkge1xuXHQgIHJldHVybiAnUHJvbWlzZXvigKZ9Jztcblx0fTtcblxuXHR0cnkge1xuXHQgIHZhciBfcHJvY2VzcyRiaW5kaW5nID0gcHJvY2Vzcy5iaW5kaW5nKCd1dGlsJyksXG5cdCAgICAgIGdldFByb21pc2VEZXRhaWxzID0gX3Byb2Nlc3MkYmluZGluZy5nZXRQcm9taXNlRGV0YWlscyxcblx0ICAgICAga1BlbmRpbmcgPSBfcHJvY2VzcyRiaW5kaW5nLmtQZW5kaW5nLFxuXHQgICAgICBrUmVqZWN0ZWQgPSBfcHJvY2VzcyRiaW5kaW5nLmtSZWplY3RlZDtcblxuXHQgIGdldFByb21pc2VWYWx1ZSA9IGZ1bmN0aW9uIGdldFByb21pc2VWYWx1ZSh2YWx1ZSwgb3B0aW9ucykge1xuXHQgICAgdmFyIF9nZXRQcm9taXNlRGV0YWlscyA9IGdldFByb21pc2VEZXRhaWxzKHZhbHVlKSxcblx0ICAgICAgICBfZ2V0UHJvbWlzZURldGFpbHMyID0gX3NsaWNlZFRvQXJyYXkoX2dldFByb21pc2VEZXRhaWxzLCAyKSxcblx0ICAgICAgICBzdGF0ZSA9IF9nZXRQcm9taXNlRGV0YWlsczJbMF0sXG5cdCAgICAgICAgaW5uZXJWYWx1ZSA9IF9nZXRQcm9taXNlRGV0YWlsczJbMV07XG5cblx0ICAgIGlmIChzdGF0ZSA9PT0ga1BlbmRpbmcpIHtcblx0ICAgICAgcmV0dXJuICdQcm9taXNlezxwZW5kaW5nPn0nO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gXCJQcm9taXNlXCIuY29uY2F0KHN0YXRlID09PSBrUmVqZWN0ZWQgPyAnIScgOiAnJywgXCJ7XCIpLmNvbmNhdChvcHRpb25zLmluc3BlY3QoaW5uZXJWYWx1ZSwgb3B0aW9ucyksIFwifVwiKTtcblx0ICB9O1xuXHR9IGNhdGNoIChub3ROb2RlKSB7XG5cdCAgLyogaWdub3JlICovXG5cdH1cblxuXHR2YXIgaW5zcGVjdFByb21pc2UgPSBnZXRQcm9taXNlVmFsdWU7XG5cblx0ZnVuY3Rpb24gaW5zcGVjdE9iamVjdChvYmplY3QsIG9wdGlvbnMpIHtcblx0ICB2YXIgcHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCk7XG5cdCAgdmFyIHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID8gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIDogW107XG5cblx0ICBpZiAocHJvcGVydGllcy5sZW5ndGggPT09IDAgJiYgc3ltYm9scy5sZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAne30nO1xuXHQgIH1cblxuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gNDtcblx0ICB2YXIgcHJvcGVydHlDb250ZW50cyA9IGluc3BlY3RMaXN0KHByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcblx0ICAgIHJldHVybiBba2V5LCBvYmplY3Rba2V5XV07XG5cdCAgfSksIG9wdGlvbnMsIGluc3BlY3RQcm9wZXJ0eSk7XG5cdCAgdmFyIHN5bWJvbENvbnRlbnRzID0gaW5zcGVjdExpc3Qoc3ltYm9scy5tYXAoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgcmV0dXJuIFtrZXksIG9iamVjdFtrZXldXTtcblx0ICB9KSwgb3B0aW9ucywgaW5zcGVjdFByb3BlcnR5KTtcblx0ICB2YXIgc2VwID0gJyc7XG5cblx0ICBpZiAocHJvcGVydHlDb250ZW50cyAmJiBzeW1ib2xDb250ZW50cykge1xuXHQgICAgc2VwID0gJywgJztcblx0ICB9XG5cblx0ICByZXR1cm4gXCJ7IFwiLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzKS5jb25jYXQoc2VwKS5jb25jYXQoc3ltYm9sQ29udGVudHMsIFwiIH1cIik7XG5cdH1cblxuXHR2YXIgdG9TdHJpbmdUYWckMSA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZyA/IFN5bWJvbC50b1N0cmluZ1RhZyA6IGZhbHNlO1xuXHRmdW5jdGlvbiBpbnNwZWN0Q2xhc3ModmFsdWUsIG9wdGlvbnMpIHtcblx0ICB2YXIgbmFtZSA9ICcnO1xuXG5cdCAgaWYgKHRvU3RyaW5nVGFnJDEgJiYgdG9TdHJpbmdUYWckMSBpbiB2YWx1ZSkge1xuXHQgICAgbmFtZSA9IHZhbHVlW3RvU3RyaW5nVGFnJDFdO1xuXHQgIH1cblxuXHQgIG5hbWUgPSBuYW1lIHx8IGdldEZ1bmNOYW1lXzEodmFsdWUuY29uc3RydWN0b3IpOyAvLyBCYWJlbCB0cmFuc2Zvcm1zIGFub255bW91cyBjbGFzc2VzIHRvIHRoZSBuYW1lIGBfY2xhc3NgXG5cblx0ICBpZiAoIW5hbWUgfHwgbmFtZSA9PT0gJ19jbGFzcycpIHtcblx0ICAgIG5hbWUgPSAnPEFub255bW91cyBDbGFzcz4nO1xuXHQgIH1cblxuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gbmFtZS5sZW5ndGg7XG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KG5hbWUpLmNvbmNhdChpbnNwZWN0T2JqZWN0KHZhbHVlLCBvcHRpb25zKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0QXJndW1lbnRzKGFyZ3MsIG9wdGlvbnMpIHtcblx0ICBpZiAoYXJncy5sZW5ndGggPT09IDApIHJldHVybiAnQXJndW1lbnRzW10nO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gMTM7XG5cdCAgcmV0dXJuIFwiQXJndW1lbnRzWyBcIi5jb25jYXQoaW5zcGVjdExpc3QoYXJncywgb3B0aW9ucyksIFwiIF1cIik7XG5cdH1cblxuXHR2YXIgZXJyb3JLZXlzID0gWydzdGFjaycsICdsaW5lJywgJ2NvbHVtbicsICduYW1lJywgJ21lc3NhZ2UnLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdjb2x1bW5OdW1iZXInLCAnbnVtYmVyJywgJ2Rlc2NyaXB0aW9uJ107XG5cdGZ1bmN0aW9uIGluc3BlY3RPYmplY3QkMShlcnJvciwgb3B0aW9ucykge1xuXHQgIHZhciBwcm9wZXJ0aWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZXJyb3IpLmZpbHRlcihmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICByZXR1cm4gZXJyb3JLZXlzLmluZGV4T2Yoa2V5KSA9PT0gLTE7XG5cdCAgfSk7XG5cdCAgdmFyIG5hbWUgPSBlcnJvci5uYW1lO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gbmFtZS5sZW5ndGg7XG5cdCAgdmFyIG1lc3NhZ2UgPSAnJztcblxuXHQgIGlmICh0eXBlb2YgZXJyb3IubWVzc2FnZSA9PT0gJ3N0cmluZycpIHtcblx0ICAgIG1lc3NhZ2UgPSB0cnVuY2F0ZShlcnJvci5tZXNzYWdlLCBvcHRpb25zLnRydW5jYXRlKTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcHJvcGVydGllcy51bnNoaWZ0KCdtZXNzYWdlJyk7XG5cdCAgfVxuXG5cdCAgbWVzc2FnZSA9IG1lc3NhZ2UgPyBcIjogXCIuY29uY2F0KG1lc3NhZ2UpIDogJyc7XG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSBtZXNzYWdlLmxlbmd0aCArIDU7XG5cdCAgdmFyIHByb3BlcnR5Q29udGVudHMgPSBpbnNwZWN0TGlzdChwcm9wZXJ0aWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICByZXR1cm4gW2tleSwgZXJyb3Jba2V5XV07XG5cdCAgfSksIG9wdGlvbnMsIGluc3BlY3RQcm9wZXJ0eSk7XG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KG5hbWUpLmNvbmNhdChtZXNzYWdlKS5jb25jYXQocHJvcGVydHlDb250ZW50cyA/IFwiIHsgXCIuY29uY2F0KHByb3BlcnR5Q29udGVudHMsIFwiIH1cIikgOiAnJyk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0QXR0cmlidXRlKF9yZWYsIG9wdGlvbnMpIHtcblx0ICB2YXIgX3JlZjIgPSBfc2xpY2VkVG9BcnJheShfcmVmLCAyKSxcblx0ICAgICAga2V5ID0gX3JlZjJbMF0sXG5cdCAgICAgIHZhbHVlID0gX3JlZjJbMV07XG5cblx0ICBvcHRpb25zLnRydW5jYXRlIC09IDM7XG5cblx0ICBpZiAoIXZhbHVlKSB7XG5cdCAgICByZXR1cm4gXCJcIi5jb25jYXQob3B0aW9ucy5zdHlsaXplKGtleSwgJ3llbGxvdycpKTtcblx0ICB9XG5cblx0ICByZXR1cm4gXCJcIi5jb25jYXQob3B0aW9ucy5zdHlsaXplKGtleSwgJ3llbGxvdycpLCBcIj1cIikuY29uY2F0KG9wdGlvbnMuc3R5bGl6ZShcIlxcXCJcIi5jb25jYXQodmFsdWUsIFwiXFxcIlwiKSwgJ3N0cmluZycpKTtcblx0fVxuXHRmdW5jdGlvbiBpbnNwZWN0SFRNTENvbGxlY3Rpb24oY29sbGVjdGlvbiwgb3B0aW9ucykge1xuXHQgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11c2UtYmVmb3JlLWRlZmluZVxuXHQgIHJldHVybiBpbnNwZWN0TGlzdChjb2xsZWN0aW9uLCBvcHRpb25zLCBpbnNwZWN0SFRNTCwgJ1xcbicpO1xuXHR9XG5cdGZ1bmN0aW9uIGluc3BlY3RIVE1MKGVsZW1lbnQsIG9wdGlvbnMpIHtcblx0ICB2YXIgcHJvcGVydGllcyA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlTmFtZXMoKTtcblx0ICB2YXIgbmFtZSA9IGVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHQgIHZhciBoZWFkID0gb3B0aW9ucy5zdHlsaXplKFwiPFwiLmNvbmNhdChuYW1lKSwgJ3NwZWNpYWwnKTtcblx0ICB2YXIgaGVhZENsb3NlID0gb3B0aW9ucy5zdHlsaXplKFwiPlwiLCAnc3BlY2lhbCcpO1xuXHQgIHZhciB0YWlsID0gb3B0aW9ucy5zdHlsaXplKFwiPC9cIi5jb25jYXQobmFtZSwgXCI+XCIpLCAnc3BlY2lhbCcpO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gbmFtZS5sZW5ndGggKiAyICsgNTtcblx0ICB2YXIgcHJvcGVydHlDb250ZW50cyA9ICcnO1xuXG5cdCAgaWYgKHByb3BlcnRpZXMubGVuZ3RoID4gMCkge1xuXHQgICAgcHJvcGVydHlDb250ZW50cyArPSAnICc7XG5cdCAgICBwcm9wZXJ0eUNvbnRlbnRzICs9IGluc3BlY3RMaXN0KHByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcblx0ICAgICAgcmV0dXJuIFtrZXksIGVsZW1lbnQuZ2V0QXR0cmlidXRlKGtleSldO1xuXHQgICAgfSksIG9wdGlvbnMsIGluc3BlY3RBdHRyaWJ1dGUsICcgJyk7XG5cdCAgfVxuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSBwcm9wZXJ0eUNvbnRlbnRzLmxlbmd0aDtcblx0ICB2YXIgdHJ1bmNhdGUgPSBvcHRpb25zLnRydW5jYXRlO1xuXHQgIHZhciBjaGlsZHJlbiA9IGluc3BlY3RIVE1MQ29sbGVjdGlvbihlbGVtZW50LmNoaWxkcmVuLCBvcHRpb25zKTtcblxuXHQgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGggPiB0cnVuY2F0ZSkge1xuXHQgICAgY2hpbGRyZW4gPSBcIlwiLmNvbmNhdCh0cnVuY2F0b3IsIFwiKFwiKS5jb25jYXQoZWxlbWVudC5jaGlsZHJlbi5sZW5ndGgsIFwiKVwiKTtcblx0ICB9XG5cblx0ICByZXR1cm4gXCJcIi5jb25jYXQoaGVhZCkuY29uY2F0KHByb3BlcnR5Q29udGVudHMpLmNvbmNhdChoZWFkQ2xvc2UpLmNvbmNhdChjaGlsZHJlbikuY29uY2F0KHRhaWwpO1xuXHR9XG5cblx0LyogIVxuXHQgKiBsb3VwZVxuXHQgKiBDb3B5cmlnaHQoYykgMjAxMyBKYWtlIEx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cblx0ICogTUlUIExpY2Vuc2VkXG5cdCAqL1xuXHR2YXIgc3ltYm9sc1N1cHBvcnRlZCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIFN5bWJvbC5mb3IgPT09ICdmdW5jdGlvbic7XG5cdHZhciBjaGFpSW5zcGVjdCA9IHN5bWJvbHNTdXBwb3J0ZWQgPyBTeW1ib2wuZm9yKCdjaGFpL2luc3BlY3QnKSA6ICdAQGNoYWkvaW5zcGVjdCc7XG5cdHZhciBub2RlSW5zcGVjdCA9IGZhbHNlO1xuXG5cdHRyeSB7XG5cdCAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGdsb2JhbC1yZXF1aXJlXG5cdCAgbm9kZUluc3BlY3QgPSByZXF1aXJlKCd1dGlsJykuaW5zcGVjdC5jdXN0b207XG5cdH0gY2F0Y2ggKG5vTm9kZUluc3BlY3QpIHtcblx0ICBub2RlSW5zcGVjdCA9IGZhbHNlO1xuXHR9XG5cblx0dmFyIGNvbnN0cnVjdG9yTWFwID0gbmV3IFdlYWtNYXAoKTtcblx0dmFyIHN0cmluZ1RhZ01hcCA9IHt9O1xuXHR2YXIgYmFzZVR5cGVzTWFwID0ge1xuXHQgIHVuZGVmaW5lZDogZnVuY3Rpb24gdW5kZWZpbmVkJDEodmFsdWUsIG9wdGlvbnMpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcblx0ICB9LFxuXHQgIG51bGw6IGZ1bmN0aW9uIF9udWxsKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKG51bGwsICdudWxsJyk7XG5cdCAgfSxcblx0ICBib29sZWFuOiBmdW5jdGlvbiBib29sZWFuKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKHZhbHVlLCAnYm9vbGVhbicpO1xuXHQgIH0sXG5cdCAgQm9vbGVhbjogZnVuY3Rpb24gQm9vbGVhbih2YWx1ZSwgb3B0aW9ucykge1xuXHQgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZSh2YWx1ZSwgJ2Jvb2xlYW4nKTtcblx0ICB9LFxuXHQgIG51bWJlcjogaW5zcGVjdE51bWJlcixcblx0ICBOdW1iZXI6IGluc3BlY3ROdW1iZXIsXG5cdCAgc3RyaW5nOiBpbnNwZWN0U3RyaW5nLFxuXHQgIFN0cmluZzogaW5zcGVjdFN0cmluZyxcblx0ICBmdW5jdGlvbjogaW5zcGVjdEZ1bmN0aW9uLFxuXHQgIEZ1bmN0aW9uOiBpbnNwZWN0RnVuY3Rpb24sXG5cdCAgc3ltYm9sOiBpbnNwZWN0U3ltYm9sLFxuXHQgIC8vIEEgU3ltYm9sIHBvbHlmaWxsIHdpbGwgcmV0dXJuIGBTeW1ib2xgIG5vdCBgc3ltYm9sYCBmcm9tIHR5cGVkZXRlY3Rcblx0ICBTeW1ib2w6IGluc3BlY3RTeW1ib2wsXG5cdCAgQXJyYXk6IGluc3BlY3RBcnJheSxcblx0ICBEYXRlOiBpbnNwZWN0RGF0ZSxcblx0ICBNYXA6IGluc3BlY3RNYXAsXG5cdCAgU2V0OiBpbnNwZWN0U2V0LFxuXHQgIFJlZ0V4cDogaW5zcGVjdFJlZ0V4cCxcblx0ICBQcm9taXNlOiBpbnNwZWN0UHJvbWlzZSxcblx0ICAvLyBXZWFrU2V0LCBXZWFrTWFwIGFyZSB0b3RhbGx5IG9wYXF1ZSB0byB1c1xuXHQgIFdlYWtTZXQ6IGZ1bmN0aW9uIFdlYWtTZXQodmFsdWUsIG9wdGlvbnMpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ1dlYWtTZXR74oCmfScsICdzcGVjaWFsJyk7XG5cdCAgfSxcblx0ICBXZWFrTWFwOiBmdW5jdGlvbiBXZWFrTWFwKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKCdXZWFrTWFwe+KApn0nLCAnc3BlY2lhbCcpO1xuXHQgIH0sXG5cdCAgQXJndW1lbnRzOiBpbnNwZWN0QXJndW1lbnRzLFxuXHQgIEludDhBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgVWludDhBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgVWludDhDbGFtcGVkQXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIEludDE2QXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIFVpbnQxNkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBJbnQzMkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBVaW50MzJBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgRmxvYXQzMkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBGbG9hdDY0QXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIEdlbmVyYXRvcjogZnVuY3Rpb24gR2VuZXJhdG9yKCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgRGF0YVZpZXc6IGZ1bmN0aW9uIERhdGFWaWV3KCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIEFycmF5QnVmZmVyKCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgRXJyb3I6IGluc3BlY3RPYmplY3QkMSxcblx0ICBIVE1MQ29sbGVjdGlvbjogaW5zcGVjdEhUTUxDb2xsZWN0aW9uLFxuXHQgIE5vZGVMaXN0OiBpbnNwZWN0SFRNTENvbGxlY3Rpb25cblx0fTsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcblxuXHR2YXIgaW5zcGVjdEN1c3RvbSA9IGZ1bmN0aW9uIGluc3BlY3RDdXN0b20odmFsdWUsIG9wdGlvbnMsIHR5cGUpIHtcblx0ICBpZiAoY2hhaUluc3BlY3QgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlW2NoYWlJbnNwZWN0XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcmV0dXJuIHZhbHVlW2NoYWlJbnNwZWN0XShvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAobm9kZUluc3BlY3QgJiYgbm9kZUluc3BlY3QgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlW25vZGVJbnNwZWN0XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcmV0dXJuIHZhbHVlW25vZGVJbnNwZWN0XShvcHRpb25zLmRlcHRoLCBvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAoJ2luc3BlY3QnIGluIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICByZXR1cm4gdmFsdWUuaW5zcGVjdChvcHRpb25zLmRlcHRoLCBvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAoJ2NvbnN0cnVjdG9yJyBpbiB2YWx1ZSAmJiBjb25zdHJ1Y3Rvck1hcC5oYXModmFsdWUuY29uc3RydWN0b3IpKSB7XG5cdCAgICByZXR1cm4gY29uc3RydWN0b3JNYXAuZ2V0KHZhbHVlLmNvbnN0cnVjdG9yKSh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfVxuXG5cdCAgaWYgKHN0cmluZ1RhZ01hcFt0eXBlXSkge1xuXHQgICAgcmV0dXJuIHN0cmluZ1RhZ01hcFt0eXBlXSh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuICcnO1xuXHR9OyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuXG5cblx0ZnVuY3Rpb24gaW5zcGVjdCh2YWx1ZSwgb3B0aW9ucykge1xuXHQgIG9wdGlvbnMgPSBub3JtYWxpc2VPcHRpb25zKG9wdGlvbnMpO1xuXHQgIG9wdGlvbnMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cdCAgdmFyIF9vcHRpb25zID0gb3B0aW9ucyxcblx0ICAgICAgY3VzdG9tSW5zcGVjdCA9IF9vcHRpb25zLmN1c3RvbUluc3BlY3Q7XG5cdCAgdmFyIHR5cGUgPSB0eXBlRGV0ZWN0KHZhbHVlKTsgLy8gSWYgaXQgaXMgYSBiYXNlIHZhbHVlIHRoYXQgd2UgYWxyZWFkeSBzdXBwb3J0LCB0aGVuIHVzZSBMb3VwZSdzIGluc3BlY3RvclxuXG5cdCAgaWYgKGJhc2VUeXBlc01hcFt0eXBlXSkge1xuXHQgICAgcmV0dXJuIGJhc2VUeXBlc01hcFt0eXBlXSh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfVxuXG5cdCAgdmFyIHByb3RvID0gdmFsdWUgPyBPYmplY3QuZ2V0UHJvdG90eXBlT2YodmFsdWUpIDogZmFsc2U7IC8vIElmIGl0J3MgYSBwbGFpbiBPYmplY3QgdGhlbiB1c2UgTG91cGUncyBpbnNwZWN0b3JcblxuXHQgIGlmIChwcm90byA9PT0gT2JqZWN0LnByb3RvdHlwZSB8fCBwcm90byA9PT0gbnVsbCkge1xuXHQgICAgcmV0dXJuIGluc3BlY3RPYmplY3QodmFsdWUsIG9wdGlvbnMpO1xuXHQgIH0gLy8gU3BlY2lmaWNhbGx5IGFjY291bnQgZm9yIEhUTUxFbGVtZW50c1xuXHQgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuXG5cblx0ICBpZiAodmFsdWUgJiYgdHlwZW9mIEhUTUxFbGVtZW50ID09PSAnZnVuY3Rpb24nICYmIHZhbHVlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcblx0ICAgIHJldHVybiBpbnNwZWN0SFRNTCh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfSAvLyBJZiBgb3B0aW9ucy5jdXN0b21JbnNwZWN0YCBpcyBzZXQgdG8gdHJ1ZSB0aGVuIHRyeSB0byB1c2UgdGhlIGN1c3RvbSBpbnNwZWN0b3JcblxuXG5cdCAgaWYgKGN1c3RvbUluc3BlY3QgJiYgdmFsdWUpIHtcblx0ICAgIHZhciBvdXRwdXQgPSBpbnNwZWN0Q3VzdG9tKHZhbHVlLCBvcHRpb25zLCB0eXBlKTtcblx0ICAgIGlmIChvdXRwdXQpIHJldHVybiBvdXRwdXQ7XG5cdCAgfSAvLyBJZiBpdCBpcyBhIGNsYXNzLCBpbnNwZWN0IGl0IGxpa2UgYW4gb2JqZWN0IGJ1dCBhZGQgdGhlIGNvbnN0cnVjdG9yIG5hbWVcblxuXG5cdCAgaWYgKCdjb25zdHJ1Y3RvcicgaW4gdmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgIT09IE9iamVjdCkge1xuXHQgICAgcmV0dXJuIGluc3BlY3RDbGFzcyh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfSAvLyBXZSBoYXZlIHJ1biBvdXQgb2Ygb3B0aW9ucyEgSnVzdCBzdHJpbmdpZnkgdGhlIHZhbHVlXG5cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoU3RyaW5nKHZhbHVlKSwgdHlwZSk7XG5cdH1cblx0ZnVuY3Rpb24gcmVnaXN0ZXJDb25zdHJ1Y3Rvcihjb25zdHJ1Y3RvciwgaW5zcGVjdG9yKSB7XG5cdCAgaWYgKGNvbnN0cnVjdG9yTWFwLmhhcyhjb25zdHJ1Y3RvcikpIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cblx0ICBjb25zdHJ1Y3Rvck1hcC5hZGQoY29uc3RydWN0b3IsIGluc3BlY3Rvcik7XG5cdCAgcmV0dXJuIHRydWU7XG5cdH1cblx0ZnVuY3Rpb24gcmVnaXN0ZXJTdHJpbmdUYWcoc3RyaW5nVGFnLCBpbnNwZWN0b3IpIHtcblx0ICBpZiAoc3RyaW5nVGFnIGluIHN0cmluZ1RhZ01hcCkge1xuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHQgIH1cblxuXHQgIHN0cmluZ1RhZ01hcFtzdHJpbmdUYWddID0gaW5zcGVjdG9yO1xuXHQgIHJldHVybiB0cnVlO1xuXHR9XG5cdHZhciBjdXN0b20gPSBjaGFpSW5zcGVjdDtcblxuXHRleHBvcnRzLmN1c3RvbSA9IGN1c3RvbTtcblx0ZXhwb3J0cy5kZWZhdWx0ID0gaW5zcGVjdDtcblx0ZXhwb3J0cy5pbnNwZWN0ID0gaW5zcGVjdDtcblx0ZXhwb3J0cy5yZWdpc3RlckNvbnN0cnVjdG9yID0gcmVnaXN0ZXJDb25zdHJ1Y3Rvcjtcblx0ZXhwb3J0cy5yZWdpc3RlclN0cmluZ1RhZyA9IHJlZ2lzdGVyU3RyaW5nVGFnO1xuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4iLCJcbnZhciB0eXBlID0gcmVxdWlyZSgnLi9qa3Jvc28tdHlwZScpXG5cbi8vIChhbnksIGFueSwgW2FycmF5XSkgLT4gYm9vbGVhblxuZnVuY3Rpb24gZXF1YWwoYSwgYiwgbWVtb3Mpe1xuICAvLyBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudFxuICBpZiAoYSA9PT0gYikgcmV0dXJuIHRydWVcbiAgdmFyIGZuQSA9IHR5cGVzW3R5cGUoYSldXG4gIHZhciBmbkIgPSB0eXBlc1t0eXBlKGIpXVxuICByZXR1cm4gZm5BICYmIGZuQSA9PT0gZm5CXG4gICAgPyBmbkEoYSwgYiwgbWVtb3MpXG4gICAgOiBmYWxzZVxufVxuXG52YXIgdHlwZXMgPSB7fVxuXG4vLyAoTnVtYmVyKSAtPiBib29sZWFuXG50eXBlcy5udW1iZXIgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEgIT09IGEgJiYgYiAhPT0gYi8qTmFuIGNoZWNrKi9cbn1cblxuLy8gKGZ1bmN0aW9uLCBmdW5jdGlvbiwgYXJyYXkpIC0+IGJvb2xlYW5cbnR5cGVzWydmdW5jdGlvbiddID0gZnVuY3Rpb24oYSwgYiwgbWVtb3Mpe1xuICByZXR1cm4gYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbiAgICAvLyBGdW5jdGlvbnMgY2FuIGFjdCBhcyBvYmplY3RzXG4gICAgJiYgdHlwZXMub2JqZWN0KGEsIGIsIG1lbW9zKVxuICAgICYmIGVxdWFsKGEucHJvdG90eXBlLCBiLnByb3RvdHlwZSlcbn1cblxuLy8gKGRhdGUsIGRhdGUpIC0+IGJvb2xlYW5cbnR5cGVzLmRhdGUgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuICthID09PSArYlxufVxuXG4vLyAocmVnZXhwLCByZWdleHApIC0+IGJvb2xlYW5cbnR5cGVzLnJlZ2V4cCA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYS50b1N0cmluZygpID09PSBiLnRvU3RyaW5nKClcbn1cblxuLy8gKERPTUVsZW1lbnQsIERPTUVsZW1lbnQpIC0+IGJvb2xlYW5cbnR5cGVzLmVsZW1lbnQgPSBmdW5jdGlvbihhLCBiKXtcbiAgcmV0dXJuIGEub3V0ZXJIVE1MID09PSBiLm91dGVySFRNTFxufVxuXG4vLyAodGV4dG5vZGUsIHRleHRub2RlKSAtPiBib29sZWFuXG50eXBlcy50ZXh0bm9kZSA9IGZ1bmN0aW9uKGEsIGIpe1xuICByZXR1cm4gYS50ZXh0Q29udGVudCA9PT0gYi50ZXh0Q29udGVudFxufVxuXG4vLyBkZWNvcmF0ZSBmbiB0byBwcmV2ZW50IGl0IHJlLWNoZWNraW5nIG9iamVjdHNcbi8vIChmdW5jdGlvbikgLT4gZnVuY3Rpb25cbmZ1bmN0aW9uIG1lbW9HYXVyZChmbil7XG4gIHJldHVybiBmdW5jdGlvbihhLCBiLCBtZW1vcyl7XG4gICAgaWYgKCFtZW1vcykgcmV0dXJuIGZuKGEsIGIsIFtdKVxuICAgIHZhciBpID0gbWVtb3MubGVuZ3RoLCBtZW1vXG4gICAgd2hpbGUgKG1lbW8gPSBtZW1vc1stLWldKSB7XG4gICAgICBpZiAobWVtb1swXSA9PT0gYSAmJiBtZW1vWzFdID09PSBiKSByZXR1cm4gdHJ1ZVxuICAgIH1cbiAgICByZXR1cm4gZm4oYSwgYiwgbWVtb3MpXG4gIH1cbn1cblxudHlwZXNbJ2FyZ3VtZW50cyddID1cbnR5cGVzWydiaXQtYXJyYXknXSA9XG50eXBlcy5hcnJheSA9IG1lbW9HYXVyZChhcnJheUVxdWFsKVxuXG4vLyAoYXJyYXksIGFycmF5LCBhcnJheSkgLT4gYm9vbGVhblxuZnVuY3Rpb24gYXJyYXlFcXVhbChhLCBiLCBtZW1vcyl7XG4gIHZhciBpID0gYS5sZW5ndGhcbiAgaWYgKGkgIT09IGIubGVuZ3RoKSByZXR1cm4gZmFsc2VcbiAgbWVtb3MucHVzaChbYSwgYl0pXG4gIHdoaWxlIChpLS0pIHtcbiAgICBpZiAoIWVxdWFsKGFbaV0sIGJbaV0sIG1lbW9zKSkgcmV0dXJuIGZhbHNlXG4gIH1cbiAgcmV0dXJuIHRydWVcbn1cblxudHlwZXMub2JqZWN0ID0gbWVtb0dhdXJkKG9iamVjdEVxdWFsKVxuXG4vLyAob2JqZWN0LCBvYmplY3QsIGFycmF5KSAtPiBib29sZWFuXG5mdW5jdGlvbiBvYmplY3RFcXVhbChhLCBiLCBtZW1vcykge1xuICBpZiAodHlwZW9mIGEuZXF1YWwgPT0gJ2Z1bmN0aW9uJykge1xuICAgIG1lbW9zLnB1c2goW2EsIGJdKVxuICAgIHJldHVybiBhLmVxdWFsKGIsIG1lbW9zKVxuICB9XG4gIHZhciBrYSA9IGdldEVudW1lcmFibGVQcm9wZXJ0aWVzKGEpXG4gIHZhciBrYiA9IGdldEVudW1lcmFibGVQcm9wZXJ0aWVzKGIpXG4gIHZhciBpID0ga2EubGVuZ3RoXG5cbiAgLy8gc2FtZSBudW1iZXIgb2YgcHJvcGVydGllc1xuICBpZiAoaSAhPT0ga2IubGVuZ3RoKSByZXR1cm4gZmFsc2VcblxuICAvLyBhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXJcbiAga2Euc29ydCgpXG4gIGtiLnNvcnQoKVxuXG4gIC8vIGNoZWFwIGtleSB0ZXN0XG4gIHdoaWxlIChpLS0pIGlmIChrYVtpXSAhPT0ga2JbaV0pIHJldHVybiBmYWxzZVxuXG4gIC8vIHJlbWVtYmVyXG4gIG1lbW9zLnB1c2goW2EsIGJdKVxuXG4gIC8vIGl0ZXJhdGUgYWdhaW4gdGhpcyB0aW1lIGRvaW5nIGEgdGhvcm91Z2ggY2hlY2tcbiAgaSA9IGthLmxlbmd0aFxuICB3aGlsZSAoaS0tKSB7XG4gICAgdmFyIGtleSA9IGthW2ldXG4gICAgaWYgKCFlcXVhbChhW2tleV0sIGJba2V5XSwgbWVtb3MpKSByZXR1cm4gZmFsc2VcbiAgfVxuXG4gIHJldHVybiB0cnVlXG59XG5cbi8vIChvYmplY3QpIC0+IGFycmF5XG5mdW5jdGlvbiBnZXRFbnVtZXJhYmxlUHJvcGVydGllcyAob2JqZWN0KSB7XG4gIHZhciByZXN1bHQgPSBbXVxuICBmb3IgKHZhciBrIGluIG9iamVjdCkgaWYgKGsgIT09ICdjb25zdHJ1Y3RvcicpIHtcbiAgICByZXN1bHQucHVzaChrKVxuICB9XG4gIHJldHVybiByZXN1bHRcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBlcXVhbFxuXG4iLCJcbnZhciB0b1N0cmluZyA9IHt9LnRvU3RyaW5nXG52YXIgRG9tTm9kZSA9IHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCdcbiAgPyB3aW5kb3cuTm9kZVxuICA6IEZ1bmN0aW9uIC8vIGNvdWxkIGJlIGFueSBmdW5jdGlvblxuXG4vKipcbiAqIFJldHVybiB0aGUgdHlwZSBvZiB2YWwuXG4gKlxuICogQHBhcmFtIHtNaXhlZH0gdmFsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZXhwb3J0cyA9IGZ1bmN0aW9uIHR5cGUoeCl7XG4gIHZhciB0eXBlID0gdHlwZW9mIHhcbiAgaWYgKHR5cGUgIT0gJ29iamVjdCcpIHJldHVybiB0eXBlXG4gIHR5cGUgPSB0eXBlc1t0b1N0cmluZy5jYWxsKHgpXVxuICBpZiAodHlwZSA9PSAnb2JqZWN0Jykge1xuICAgIC8vIGluIGNhc2UgdGhleSBoYXZlIGJlZW4gcG9seWZpbGxlZFxuICAgIGlmICh4IGluc3RhbmNlb2YgTWFwKSByZXR1cm4gJ21hcCdcbiAgICBpZiAoeCBpbnN0YW5jZW9mIFNldCkgcmV0dXJuICdzZXQnXG4gICAgcmV0dXJuICdvYmplY3QnXG4gIH1cbiAgaWYgKHR5cGUpIHJldHVybiB0eXBlXG4gIGlmICh4IGluc3RhbmNlb2YgRG9tTm9kZSkgc3dpdGNoICh4Lm5vZGVUeXBlKSB7XG4gICAgY2FzZSAxOiAgcmV0dXJuICdlbGVtZW50J1xuICAgIGNhc2UgMzogIHJldHVybiAndGV4dC1ub2RlJ1xuICAgIGNhc2UgOTogIHJldHVybiAnZG9jdW1lbnQnXG4gICAgY2FzZSAxMTogcmV0dXJuICdkb2N1bWVudC1mcmFnbWVudCdcbiAgICBkZWZhdWx0OiByZXR1cm4gJ2RvbS1ub2RlJ1xuICB9XG59XG5cbnZhciB0eXBlcyA9IGV4cG9ydHMudHlwZXMgPSB7XG4gICdbb2JqZWN0IEZ1bmN0aW9uXSc6ICdmdW5jdGlvbicsXG4gICdbb2JqZWN0IERhdGVdJzogJ2RhdGUnLFxuICAnW29iamVjdCBSZWdFeHBdJzogJ3JlZ2V4cCcsXG4gICdbb2JqZWN0IEFyZ3VtZW50c10nOiAnYXJndW1lbnRzJyxcbiAgJ1tvYmplY3QgQXJyYXldJzogJ2FycmF5JyxcbiAgJ1tvYmplY3QgU2V0XSc6ICdzZXQnLFxuICAnW29iamVjdCBTdHJpbmddJzogJ3N0cmluZycsXG4gICdbb2JqZWN0IE51bGxdJzogJ251bGwnLFxuICAnW29iamVjdCBVbmRlZmluZWRdJzogJ3VuZGVmaW5lZCcsXG4gICdbb2JqZWN0IE51bWJlcl0nOiAnbnVtYmVyJyxcbiAgJ1tvYmplY3QgQm9vbGVhbl0nOiAnYm9vbGVhbicsXG4gICdbb2JqZWN0IE9iamVjdF0nOiAnb2JqZWN0JyxcbiAgJ1tvYmplY3QgTWFwXSc6ICdtYXAnLFxuICAnW29iamVjdCBUZXh0XSc6ICd0ZXh0LW5vZGUnLFxuICAnW29iamVjdCBVaW50OEFycmF5XSc6ICdiaXQtYXJyYXknLFxuICAnW29iamVjdCBVaW50MTZBcnJheV0nOiAnYml0LWFycmF5JyxcbiAgJ1tvYmplY3QgVWludDMyQXJyYXldJzogJ2JpdC1hcnJheScsXG4gICdbb2JqZWN0IFVpbnQ4Q2xhbXBlZEFycmF5XSc6ICdiaXQtYXJyYXknLFxuICAnW29iamVjdCBFcnJvcl0nOiAnZXJyb3InLFxuICAnW29iamVjdCBGb3JtRGF0YV0nOiAnZm9ybS1kYXRhJyxcbiAgJ1tvYmplY3QgRmlsZV0nOiAnZmlsZScsXG4gICdbb2JqZWN0IEJsb2JdJzogJ2Jsb2InXG59XG5cbiIsIihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuXHR0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcblx0KGdsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiBnbG9iYWwgfHwgc2VsZiwgZmFjdG9yeShnbG9iYWwubG91cGUgPSB7fSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG5cdHZhciBjb21tb25qc0dsb2JhbCA9IHR5cGVvZiBnbG9iYWxUaGlzICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbFRoaXMgOiB0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyA/IHdpbmRvdyA6IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogdHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHt9O1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZUNvbW1vbmpzTW9kdWxlKGZuKSB7XG5cdCAgdmFyIG1vZHVsZSA9IHsgZXhwb3J0czoge30gfTtcblx0XHRyZXR1cm4gZm4obW9kdWxlLCBtb2R1bGUuZXhwb3J0cyksIG1vZHVsZS5leHBvcnRzO1xuXHR9XG5cblx0dmFyIHR5cGVEZXRlY3QgPSBjcmVhdGVDb21tb25qc01vZHVsZShmdW5jdGlvbiAobW9kdWxlLCBleHBvcnRzKSB7XG5cdChmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG5cdFx0IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDtcblx0fShjb21tb25qc0dsb2JhbCwgKGZ1bmN0aW9uICgpIHtcblx0LyogIVxuXHQgKiB0eXBlLWRldGVjdFxuXHQgKiBDb3B5cmlnaHQoYykgMjAxMyBqYWtlIGx1ZXIgPGpha2VAYWxvZ2ljYWxwYXJhZG94LmNvbT5cblx0ICogTUlUIExpY2Vuc2VkXG5cdCAqL1xuXHR2YXIgcHJvbWlzZUV4aXN0cyA9IHR5cGVvZiBQcm9taXNlID09PSAnZnVuY3Rpb24nO1xuXG5cdC8qIGVzbGludC1kaXNhYmxlIG5vLXVuZGVmICovXG5cdHZhciBnbG9iYWxPYmplY3QgPSB0eXBlb2Ygc2VsZiA9PT0gJ29iamVjdCcgPyBzZWxmIDogY29tbW9uanNHbG9iYWw7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgaWQtYmxhY2tsaXN0XG5cblx0dmFyIHN5bWJvbEV4aXN0cyA9IHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnO1xuXHR2YXIgbWFwRXhpc3RzID0gdHlwZW9mIE1hcCAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBzZXRFeGlzdHMgPSB0eXBlb2YgU2V0ICE9PSAndW5kZWZpbmVkJztcblx0dmFyIHdlYWtNYXBFeGlzdHMgPSB0eXBlb2YgV2Vha01hcCAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciB3ZWFrU2V0RXhpc3RzID0gdHlwZW9mIFdlYWtTZXQgIT09ICd1bmRlZmluZWQnO1xuXHR2YXIgZGF0YVZpZXdFeGlzdHMgPSB0eXBlb2YgRGF0YVZpZXcgIT09ICd1bmRlZmluZWQnO1xuXHR2YXIgc3ltYm9sSXRlcmF0b3JFeGlzdHMgPSBzeW1ib2xFeGlzdHMgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciAhPT0gJ3VuZGVmaW5lZCc7XG5cdHZhciBzeW1ib2xUb1N0cmluZ1RhZ0V4aXN0cyA9IHN5bWJvbEV4aXN0cyAmJiB0eXBlb2YgU3ltYm9sLnRvU3RyaW5nVGFnICE9PSAndW5kZWZpbmVkJztcblx0dmFyIHNldEVudHJpZXNFeGlzdHMgPSBzZXRFeGlzdHMgJiYgdHlwZW9mIFNldC5wcm90b3R5cGUuZW50cmllcyA9PT0gJ2Z1bmN0aW9uJztcblx0dmFyIG1hcEVudHJpZXNFeGlzdHMgPSBtYXBFeGlzdHMgJiYgdHlwZW9mIE1hcC5wcm90b3R5cGUuZW50cmllcyA9PT0gJ2Z1bmN0aW9uJztcblx0dmFyIHNldEl0ZXJhdG9yUHJvdG90eXBlID0gc2V0RW50cmllc0V4aXN0cyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YobmV3IFNldCgpLmVudHJpZXMoKSk7XG5cdHZhciBtYXBJdGVyYXRvclByb3RvdHlwZSA9IG1hcEVudHJpZXNFeGlzdHMgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKG5ldyBNYXAoKS5lbnRyaWVzKCkpO1xuXHR2YXIgYXJyYXlJdGVyYXRvckV4aXN0cyA9IHN5bWJvbEl0ZXJhdG9yRXhpc3RzICYmIHR5cGVvZiBBcnJheS5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9PT0gJ2Z1bmN0aW9uJztcblx0dmFyIGFycmF5SXRlcmF0b3JQcm90b3R5cGUgPSBhcnJheUl0ZXJhdG9yRXhpc3RzICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihbXVtTeW1ib2wuaXRlcmF0b3JdKCkpO1xuXHR2YXIgc3RyaW5nSXRlcmF0b3JFeGlzdHMgPSBzeW1ib2xJdGVyYXRvckV4aXN0cyAmJiB0eXBlb2YgU3RyaW5nLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID09PSAnZnVuY3Rpb24nO1xuXHR2YXIgc3RyaW5nSXRlcmF0b3JQcm90b3R5cGUgPSBzdHJpbmdJdGVyYXRvckV4aXN0cyAmJiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoJydbU3ltYm9sLml0ZXJhdG9yXSgpKTtcblx0dmFyIHRvU3RyaW5nTGVmdFNsaWNlTGVuZ3RoID0gODtcblx0dmFyIHRvU3RyaW5nUmlnaHRTbGljZUxlbmd0aCA9IC0xO1xuXHQvKipcblx0ICogIyMjIHR5cGVPZiAob2JqKVxuXHQgKlxuXHQgKiBVc2VzIGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nYCB0byBkZXRlcm1pbmUgdGhlIHR5cGUgb2YgYW4gb2JqZWN0LFxuXHQgKiBub3JtYWxpc2luZyBiZWhhdmlvdXIgYWNyb3NzIGVuZ2luZSB2ZXJzaW9ucyAmIHdlbGwgb3B0aW1pc2VkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge01peGVkfSBvYmplY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfSBvYmplY3QgdHlwZVxuXHQgKiBAYXBpIHB1YmxpY1xuXHQgKi9cblx0ZnVuY3Rpb24gdHlwZURldGVjdChvYmopIHtcblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICAqIFByZTpcblx0ICAgKiAgIHN0cmluZyBsaXRlcmFsICAgICB4IDMsMDM5LDAzNSBvcHMvc2VjIMKxMS42MiUgKDc4IHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIGJvb2xlYW4gbGl0ZXJhbCAgICB4IDEsNDI0LDEzOCBvcHMvc2VjIMKxNC41NCUgKDc1IHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIG51bWJlciBsaXRlcmFsICAgICB4IDEsNjUzLDE1MyBvcHMvc2VjIMKxMS45MSUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIHVuZGVmaW5lZCAgICAgICAgICB4IDksOTc4LDY2MCBvcHMvc2VjIMKxMS45MiUgKDc1IHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIGZ1bmN0aW9uICAgICAgICAgICB4IDIsNTU2LDc2OSBvcHMvc2VjIMKxMS43MyUgKDc3IHJ1bnMgc2FtcGxlZClcblx0ICAgKiBQb3N0OlxuXHQgICAqICAgc3RyaW5nIGxpdGVyYWwgICAgIHggMzgsNTY0LDc5NiBvcHMvc2VjIMKxMS4xNSUgKDc5IHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIGJvb2xlYW4gbGl0ZXJhbCAgICB4IDMxLDE0OCw5NDAgb3BzL3NlYyDCsTEuMTAlICg3OSBydW5zIHNhbXBsZWQpXG5cdCAgICogICBudW1iZXIgbGl0ZXJhbCAgICAgeCAzMiw2NzksMzMwIG9wcy9zZWMgwrExLjkwJSAoNzggcnVucyBzYW1wbGVkKVxuXHQgICAqICAgdW5kZWZpbmVkICAgICAgICAgIHggMzIsMzYzLDM2OCBvcHMvc2VjIMKxMS4wNyUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAgKiAgIGZ1bmN0aW9uICAgICAgICAgICB4IDMxLDI5Niw4NzAgb3BzL3NlYyDCsTAuOTYlICg4MyBydW5zIHNhbXBsZWQpXG5cdCAgICovXG5cdCAgdmFyIHR5cGVvZk9iaiA9IHR5cGVvZiBvYmo7XG5cdCAgaWYgKHR5cGVvZk9iaiAhPT0gJ29iamVjdCcpIHtcblx0ICAgIHJldHVybiB0eXBlb2ZPYmo7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAgKiBQcmU6XG5cdCAgICogICBudWxsICAgICAgICAgICAgICAgeCAyOCw2NDUsNzY1IG9wcy9zZWMgwrExLjE3JSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICAqIFBvc3Q6XG5cdCAgICogICBudWxsICAgICAgICAgICAgICAgeCAzNiw0MjgsOTYyIG9wcy9zZWMgwrExLjM3JSAoODQgcnVucyBzYW1wbGVkKVxuXHQgICAqL1xuXHQgIGlmIChvYmogPT09IG51bGwpIHtcblx0ICAgIHJldHVybiAnbnVsbCc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh3aW5kb3cpYGBcblx0ICAgKiAgLSBOb2RlID09PSBcIltvYmplY3QgZ2xvYmFsXVwiXG5cdCAgICogIC0gQ2hyb21lID09PSBcIltvYmplY3QgZ2xvYmFsXVwiXG5cdCAgICogIC0gRmlyZWZveCA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuXHQgICAqICAtIFBoYW50b21KUyA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuXHQgICAqICAtIFNhZmFyaSA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuXHQgICAqICAtIElFIDExID09PSBcIltvYmplY3QgV2luZG93XVwiXG5cdCAgICogIC0gSUUgRWRnZSA9PT0gXCJbb2JqZWN0IFdpbmRvd11cIlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodGhpcylgYFxuXHQgICAqICAtIENocm9tZSBXb3JrZXIgPT09IFwiW29iamVjdCBnbG9iYWxdXCJcblx0ICAgKiAgLSBGaXJlZm94IFdvcmtlciA9PT0gXCJbb2JqZWN0IERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlXVwiXG5cdCAgICogIC0gU2FmYXJpIFdvcmtlciA9PT0gXCJbb2JqZWN0IERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlXVwiXG5cdCAgICogIC0gSUUgMTEgV29ya2VyID09PSBcIltvYmplY3QgV29ya2VyR2xvYmFsU2NvcGVdXCJcblx0ICAgKiAgLSBJRSBFZGdlIFdvcmtlciA9PT0gXCJbb2JqZWN0IFdvcmtlckdsb2JhbFNjb3BlXVwiXG5cdCAgICovXG5cdCAgaWYgKG9iaiA9PT0gZ2xvYmFsT2JqZWN0KSB7XG5cdCAgICByZXR1cm4gJ2dsb2JhbCc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAgKiBQcmU6XG5cdCAgICogICBhcnJheSBsaXRlcmFsICAgICAgeCAyLDg4OCwzNTIgb3BzL3NlYyDCsTAuNjclICg4MiBydW5zIHNhbXBsZWQpXG5cdCAgICogUG9zdDpcblx0ICAgKiAgIGFycmF5IGxpdGVyYWwgICAgICB4IDIyLDQ3OSw2NTAgb3BzL3NlYyDCsTAuOTYlICg4MSBydW5zIHNhbXBsZWQpXG5cdCAgICovXG5cdCAgaWYgKFxuXHQgICAgQXJyYXkuaXNBcnJheShvYmopICYmXG5cdCAgICAoc3ltYm9sVG9TdHJpbmdUYWdFeGlzdHMgPT09IGZhbHNlIHx8ICEoU3ltYm9sLnRvU3RyaW5nVGFnIGluIG9iaikpXG5cdCAgKSB7XG5cdCAgICByZXR1cm4gJ0FycmF5Jztcblx0ICB9XG5cblx0ICAvLyBOb3QgY2FjaGluZyBleGlzdGVuY2Ugb2YgYHdpbmRvd2AgYW5kIHJlbGF0ZWQgcHJvcGVydGllcyBkdWUgdG8gcG90ZW50aWFsXG5cdCAgLy8gZm9yIGB3aW5kb3dgIHRvIGJlIHVuc2V0IGJlZm9yZSB0ZXN0cyBpbiBxdWFzaS1icm93c2VyIGVudmlyb25tZW50cy5cblx0ICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ29iamVjdCcgJiYgd2luZG93ICE9PSBudWxsKSB7XG5cdCAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnL211bHRpcGFnZS9icm93c2Vycy5odG1sI2xvY2F0aW9uKVxuXHQgICAgICogV2hhdFdHIEhUTUwkNy43LjMgLSBUaGUgYExvY2F0aW9uYCBpbnRlcmZhY2Vcblx0ICAgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwod2luZG93LmxvY2F0aW9uKWBgXG5cdCAgICAgKiAgLSBJRSA8PTExID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG5cdCAgICAgKiAgLSBJRSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgICAqL1xuXHQgICAgaWYgKHR5cGVvZiB3aW5kb3cubG9jYXRpb24gPT09ICdvYmplY3QnICYmIG9iaiA9PT0gd2luZG93LmxvY2F0aW9uKSB7XG5cdCAgICAgIHJldHVybiAnTG9jYXRpb24nO1xuXHQgICAgfVxuXG5cdCAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNkb2N1bWVudClcblx0ICAgICAqIFdoYXRXRyBIVE1MJDMuMS4xIC0gVGhlIGBEb2N1bWVudGAgb2JqZWN0XG5cdCAgICAgKiBOb3RlOiBNb3N0IGJyb3dzZXJzIGN1cnJlbnRseSBhZGhlciB0byB0aGUgVzNDIERPTSBMZXZlbCAyIHNwZWNcblx0ICAgICAqICAgICAgIChodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTItSFRNTC9odG1sLmh0bWwjSUQtMjY4MDkyNjgpXG5cdCAgICAgKiAgICAgICB3aGljaCBzdWdnZXN0cyB0aGF0IGJyb3dzZXJzIHNob3VsZCB1c2UgSFRNTFRhYmxlQ2VsbEVsZW1lbnQgZm9yXG5cdCAgICAgKiAgICAgICBib3RoIFREIGFuZCBUSCBlbGVtZW50cy4gV2hhdFdHIHNlcGFyYXRlcyB0aGVzZS5cblx0ICAgICAqICAgICAgIFdoYXRXRyBIVE1MIHN0YXRlczpcblx0ICAgICAqICAgICAgICAgPiBGb3IgaGlzdG9yaWNhbCByZWFzb25zLCBXaW5kb3cgb2JqZWN0cyBtdXN0IGFsc28gaGF2ZSBhXG5cdCAgICAgKiAgICAgICAgID4gd3JpdGFibGUsIGNvbmZpZ3VyYWJsZSwgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgbmFtZWRcblx0ICAgICAqICAgICAgICAgPiBIVE1MRG9jdW1lbnQgd2hvc2UgdmFsdWUgaXMgdGhlIERvY3VtZW50IGludGVyZmFjZSBvYmplY3QuXG5cdCAgICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRvY3VtZW50KWBgXG5cdCAgICAgKiAgLSBDaHJvbWUgPT09IFwiW29iamVjdCBIVE1MRG9jdW1lbnRdXCJcblx0ICAgICAqICAtIEZpcmVmb3ggPT09IFwiW29iamVjdCBIVE1MRG9jdW1lbnRdXCJcblx0ICAgICAqICAtIFNhZmFyaSA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuXHQgICAgICogIC0gSUUgPD0xMCA9PT0gXCJbb2JqZWN0IERvY3VtZW50XVwiXG5cdCAgICAgKiAgLSBJRSAxMSA9PT0gXCJbb2JqZWN0IEhUTUxEb2N1bWVudF1cIlxuXHQgICAgICogIC0gSUUgRWRnZSA8PTEzID09PSBcIltvYmplY3QgSFRNTERvY3VtZW50XVwiXG5cdCAgICAgKi9cblx0ICAgIGlmICh0eXBlb2Ygd2luZG93LmRvY3VtZW50ID09PSAnb2JqZWN0JyAmJiBvYmogPT09IHdpbmRvdy5kb2N1bWVudCkge1xuXHQgICAgICByZXR1cm4gJ0RvY3VtZW50Jztcblx0ICAgIH1cblxuXHQgICAgaWYgKHR5cGVvZiB3aW5kb3cubmF2aWdhdG9yID09PSAnb2JqZWN0Jykge1xuXHQgICAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3dlYmFwcGFwaXMuaHRtbCNtaW1ldHlwZWFycmF5KVxuXHQgICAgICAgKiBXaGF0V0cgSFRNTCQ4LjYuMS41IC0gUGx1Z2lucyAtIEludGVyZmFjZSBNaW1lVHlwZUFycmF5XG5cdCAgICAgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmF2aWdhdG9yLm1pbWVUeXBlcylgYFxuXHQgICAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgTVNNaW1lVHlwZXNDb2xsZWN0aW9uXVwiXG5cdCAgICAgICAqL1xuXHQgICAgICBpZiAodHlwZW9mIHdpbmRvdy5uYXZpZ2F0b3IubWltZVR5cGVzID09PSAnb2JqZWN0JyAmJlxuXHQgICAgICAgICAgb2JqID09PSB3aW5kb3cubmF2aWdhdG9yLm1pbWVUeXBlcykge1xuXHQgICAgICAgIHJldHVybiAnTWltZVR5cGVBcnJheSc7XG5cdCAgICAgIH1cblxuXHQgICAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAgICogKGh0dHBzOi8vaHRtbC5zcGVjLndoYXR3Zy5vcmcvbXVsdGlwYWdlL3dlYmFwcGFwaXMuaHRtbCNwbHVnaW5hcnJheSlcblx0ICAgICAgICogV2hhdFdHIEhUTUwkOC42LjEuNSAtIFBsdWdpbnMgLSBJbnRlcmZhY2UgUGx1Z2luQXJyYXlcblx0ICAgICAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuYXZpZ2F0b3IucGx1Z2lucylgYFxuXHQgICAgICAgKiAgLSBJRSA8PTEwID09PSBcIltvYmplY3QgTVNQbHVnaW5zQ29sbGVjdGlvbl1cIlxuXHQgICAgICAgKi9cblx0ICAgICAgaWYgKHR5cGVvZiB3aW5kb3cubmF2aWdhdG9yLnBsdWdpbnMgPT09ICdvYmplY3QnICYmXG5cdCAgICAgICAgICBvYmogPT09IHdpbmRvdy5uYXZpZ2F0b3IucGx1Z2lucykge1xuXHQgICAgICAgIHJldHVybiAnUGx1Z2luQXJyYXknO1xuXHQgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGlmICgodHlwZW9mIHdpbmRvdy5IVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJyB8fFxuXHQgICAgICAgIHR5cGVvZiB3aW5kb3cuSFRNTEVsZW1lbnQgPT09ICdvYmplY3QnKSAmJlxuXHQgICAgICAgIG9iaiBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MRWxlbWVudCkge1xuXHQgICAgICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgICAgKiAoaHR0cHM6Ly9odG1sLnNwZWMud2hhdHdnLm9yZy9tdWx0aXBhZ2Uvd2ViYXBwYXBpcy5odG1sI3BsdWdpbmFycmF5KVxuXHQgICAgICAqIFdoYXRXRyBIVE1MJDQuNC40IC0gVGhlIGBibG9ja3F1b3RlYCBlbGVtZW50IC0gSW50ZXJmYWNlIGBIVE1MUXVvdGVFbGVtZW50YFxuXHQgICAgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYmxvY2txdW90ZScpKWBgXG5cdCAgICAgICogIC0gSUUgPD0xMCA9PT0gXCJbb2JqZWN0IEhUTUxCbG9ja0VsZW1lbnRdXCJcblx0ICAgICAgKi9cblx0ICAgICAgaWYgKG9iai50YWdOYW1lID09PSAnQkxPQ0tRVU9URScpIHtcblx0ICAgICAgICByZXR1cm4gJ0hUTUxRdW90ZUVsZW1lbnQnO1xuXHQgICAgICB9XG5cblx0ICAgICAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNodG1sdGFibGVkYXRhY2VsbGVsZW1lbnQpXG5cdCAgICAgICAqIFdoYXRXRyBIVE1MJDQuOS45IC0gVGhlIGB0ZGAgZWxlbWVudCAtIEludGVyZmFjZSBgSFRNTFRhYmxlRGF0YUNlbGxFbGVtZW50YFxuXHQgICAgICAgKiBOb3RlOiBNb3N0IGJyb3dzZXJzIGN1cnJlbnRseSBhZGhlciB0byB0aGUgVzNDIERPTSBMZXZlbCAyIHNwZWNcblx0ICAgICAgICogICAgICAgKGh0dHBzOi8vd3d3LnczLm9yZy9UUi9ET00tTGV2ZWwtMi1IVE1ML2h0bWwuaHRtbCNJRC04MjkxNTA3NSlcblx0ICAgICAgICogICAgICAgd2hpY2ggc3VnZ2VzdHMgdGhhdCBicm93c2VycyBzaG91bGQgdXNlIEhUTUxUYWJsZUNlbGxFbGVtZW50IGZvclxuXHQgICAgICAgKiAgICAgICBib3RoIFREIGFuZCBUSCBlbGVtZW50cy4gV2hhdFdHIHNlcGFyYXRlcyB0aGVzZS5cblx0ICAgICAgICogVGVzdDogT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RkJykpXG5cdCAgICAgICAqICAtIENocm9tZSA9PT0gXCJbb2JqZWN0IEhUTUxUYWJsZUNlbGxFbGVtZW50XVwiXG5cdCAgICAgICAqICAtIEZpcmVmb3ggPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuXHQgICAgICAgKiAgLSBTYWZhcmkgPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuXHQgICAgICAgKi9cblx0ICAgICAgaWYgKG9iai50YWdOYW1lID09PSAnVEQnKSB7XG5cdCAgICAgICAgcmV0dXJuICdIVE1MVGFibGVEYXRhQ2VsbEVsZW1lbnQnO1xuXHQgICAgICB9XG5cblx0ICAgICAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICAgICAqIChodHRwczovL2h0bWwuc3BlYy53aGF0d2cub3JnLyNodG1sdGFibGVoZWFkZXJjZWxsZWxlbWVudClcblx0ICAgICAgICogV2hhdFdHIEhUTUwkNC45LjkgLSBUaGUgYHRkYCBlbGVtZW50IC0gSW50ZXJmYWNlIGBIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudGBcblx0ICAgICAgICogTm90ZTogTW9zdCBicm93c2VycyBjdXJyZW50bHkgYWRoZXIgdG8gdGhlIFczQyBET00gTGV2ZWwgMiBzcGVjXG5cdCAgICAgICAqICAgICAgIChodHRwczovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTItSFRNTC9odG1sLmh0bWwjSUQtODI5MTUwNzUpXG5cdCAgICAgICAqICAgICAgIHdoaWNoIHN1Z2dlc3RzIHRoYXQgYnJvd3NlcnMgc2hvdWxkIHVzZSBIVE1MVGFibGVDZWxsRWxlbWVudCBmb3Jcblx0ICAgICAgICogICAgICAgYm90aCBURCBhbmQgVEggZWxlbWVudHMuIFdoYXRXRyBzZXBhcmF0ZXMgdGhlc2UuXG5cdCAgICAgICAqIFRlc3Q6IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0aCcpKVxuXHQgICAgICAgKiAgLSBDaHJvbWUgPT09IFwiW29iamVjdCBIVE1MVGFibGVDZWxsRWxlbWVudF1cIlxuXHQgICAgICAgKiAgLSBGaXJlZm94ID09PSBcIltvYmplY3QgSFRNTFRhYmxlQ2VsbEVsZW1lbnRdXCJcblx0ICAgICAgICogIC0gU2FmYXJpID09PSBcIltvYmplY3QgSFRNTFRhYmxlQ2VsbEVsZW1lbnRdXCJcblx0ICAgICAgICovXG5cdCAgICAgIGlmIChvYmoudGFnTmFtZSA9PT0gJ1RIJykge1xuXHQgICAgICAgIHJldHVybiAnSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQnO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAqIFByZTpcblx0ICAqICAgRmxvYXQ2NEFycmF5ICAgICAgIHggNjI1LDY0NCBvcHMvc2VjIMKxMS41OCUgKDgwIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgRmxvYXQzMkFycmF5ICAgICAgIHggMSwyNzksODUyIG9wcy9zZWMgwrEyLjkxJSAoNzcgcnVucyBzYW1wbGVkKVxuXHQgICogICBVaW50MzJBcnJheSAgICAgICAgeCAxLDE3OCwxODUgb3BzL3NlYyDCsTEuOTUlICg4MyBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQxNkFycmF5ICAgICAgICB4IDEsMDA4LDM4MCBvcHMvc2VjIMKxMi4yNSUgKDgwIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgVWludDhBcnJheSAgICAgICAgIHggMSwxMjgsMDQwIG9wcy9zZWMgwrEyLjExJSAoODEgcnVucyBzYW1wbGVkKVxuXHQgICogICBJbnQzMkFycmF5ICAgICAgICAgeCAxLDE3MCwxMTkgb3BzL3NlYyDCsTIuODglICg4MCBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIEludDE2QXJyYXkgICAgICAgICB4IDEsMTc2LDM0OCBvcHMvc2VjIMKxNS43OSUgKDg2IHJ1bnMgc2FtcGxlZClcblx0ICAqICAgSW50OEFycmF5ICAgICAgICAgIHggMSwwNTgsNzA3IG9wcy9zZWMgwrE0Ljk0JSAoNzcgcnVucyBzYW1wbGVkKVxuXHQgICogICBVaW50OENsYW1wZWRBcnJheSAgeCAxLDExMCw2MzMgb3BzL3NlYyDCsTQuMjAlICg4MCBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICBGbG9hdDY0QXJyYXkgICAgICAgeCA3LDEwNSw2NzEgb3BzL3NlYyDCsTEzLjQ3JSAoNjQgcnVucyBzYW1wbGVkKVxuXHQgICogICBGbG9hdDMyQXJyYXkgICAgICAgeCA1LDg4Nyw5MTIgb3BzL3NlYyDCsTEuNDYlICg4MiBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQzMkFycmF5ICAgICAgICB4IDYsNDkxLDY2MSBvcHMvc2VjIMKxMS43NiUgKDc5IHJ1bnMgc2FtcGxlZClcblx0ICAqICAgVWludDE2QXJyYXkgICAgICAgIHggNiw1NTksNzk1IG9wcy9zZWMgwrExLjY3JSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICogICBVaW50OEFycmF5ICAgICAgICAgeCA2LDQ2Myw5NjYgb3BzL3NlYyDCsTEuNDMlICg4NSBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIEludDMyQXJyYXkgICAgICAgICB4IDUsNjQxLDg0MSBvcHMvc2VjIMKxMy40OSUgKDgxIHJ1bnMgc2FtcGxlZClcblx0ICAqICAgSW50MTZBcnJheSAgICAgICAgIHggNiw1ODMsNTExIG9wcy9zZWMgwrExLjk4JSAoODAgcnVucyBzYW1wbGVkKVxuXHQgICogICBJbnQ4QXJyYXkgICAgICAgICAgeCA2LDYwNiwwNzggb3BzL3NlYyDCsTEuNzQlICg4MSBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIFVpbnQ4Q2xhbXBlZEFycmF5ICB4IDYsNjAyLDIyNCBvcHMvc2VjIMKxMS43NyUgKDgzIHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIHZhciBzdHJpbmdUYWcgPSAoc3ltYm9sVG9TdHJpbmdUYWdFeGlzdHMgJiYgb2JqW1N5bWJvbC50b1N0cmluZ1RhZ10pO1xuXHQgIGlmICh0eXBlb2Ygc3RyaW5nVGFnID09PSAnc3RyaW5nJykge1xuXHQgICAgcmV0dXJuIHN0cmluZ1RhZztcblx0ICB9XG5cblx0ICB2YXIgb2JqUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKG9iaik7XG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAqIFByZTpcblx0ICAqICAgcmVnZXggbGl0ZXJhbCAgICAgIHggMSw3NzIsMzg1IG9wcy9zZWMgwrExLjg1JSAoNzcgcnVucyBzYW1wbGVkKVxuXHQgICogICByZWdleCBjb25zdHJ1Y3RvciAgeCAyLDE0Myw2MzQgb3BzL3NlYyDCsTIuNDYlICg3OCBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICByZWdleCBsaXRlcmFsICAgICAgeCAzLDkyOCwwMDkgb3BzL3NlYyDCsTAuNjUlICg3OCBydW5zIHNhbXBsZWQpXG5cdCAgKiAgIHJlZ2V4IGNvbnN0cnVjdG9yICB4IDMsOTMxLDEwOCBvcHMvc2VjIMKxMC41OCUgKDg0IHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmIChvYmpQcm90b3R5cGUgPT09IFJlZ0V4cC5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnUmVnRXhwJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICBkYXRlICAgICAgICAgICAgICAgeCAyLDEzMCwwNzQgb3BzL3NlYyDCsTQuNDIlICg2OCBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICBkYXRlICAgICAgICAgICAgICAgeCAzLDk1Myw3Nzkgb3BzL3NlYyDCsTEuMzUlICg3NyBydW5zIHNhbXBsZWQpXG5cdCAgKi9cblx0ICBpZiAob2JqUHJvdG90eXBlID09PSBEYXRlLnByb3RvdHlwZSkge1xuXHQgICAgcmV0dXJuICdEYXRlJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy1wcm9taXNlLnByb3RvdHlwZS1AQHRvc3RyaW5ndGFnKVxuXHQgICAqIEVTNiQyNS40LjUuNCAtIFByb21pc2UucHJvdG90eXBlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIlByb21pc2VcIjpcblx0ICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKFByb21pc2UucmVzb2x2ZSgpKWBgXG5cdCAgICogIC0gQ2hyb21lIDw9NDcgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKiAgLSBFZGdlIDw9MjAgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKiAgLSBGaXJlZm94IDI5LUxhdGVzdCA9PT0gXCJbb2JqZWN0IFByb21pc2VdXCJcblx0ICAgKiAgLSBTYWZhcmkgNy4xLUxhdGVzdCA9PT0gXCJbb2JqZWN0IFByb21pc2VdXCJcblx0ICAgKi9cblx0ICBpZiAocHJvbWlzZUV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IFByb21pc2UucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ1Byb21pc2UnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgKiBQcmU6XG5cdCAgKiAgIHNldCAgICAgICAgICAgICAgICB4IDIsMjIyLDE4NiBvcHMvc2VjIMKxMS4zMSUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIHNldCAgICAgICAgICAgICAgICB4IDQsNTQ1LDg3OSBvcHMvc2VjIMKxMS4xMyUgKDgzIHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmIChzZXRFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBTZXQucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ1NldCc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVlZCBvcHRpbWlzYXRpb25cblx0ICAqIFByZTpcblx0ICAqICAgbWFwICAgICAgICAgICAgICAgIHggMiwzOTYsODQyIG9wcy9zZWMgwrExLjU5JSAoODEgcnVucyBzYW1wbGVkKVxuXHQgICogUG9zdDpcblx0ICAqICAgbWFwICAgICAgICAgICAgICAgIHggNCwxODMsOTQ1IG9wcy9zZWMgwrE2LjU5JSAoODIgcnVucyBzYW1wbGVkKVxuXHQgICovXG5cdCAgaWYgKG1hcEV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IE1hcC5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnTWFwJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICB3ZWFrc2V0ICAgICAgICAgICAgeCAxLDMyMywyMjAgb3BzL3NlYyDCsTIuMTclICg3NiBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICB3ZWFrc2V0ICAgICAgICAgICAgeCA0LDIzNyw1MTAgb3BzL3NlYyDCsTIuMDElICg3NyBydW5zIHNhbXBsZWQpXG5cdCAgKi9cblx0ICBpZiAod2Vha1NldEV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IFdlYWtTZXQucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ1dlYWtTZXQnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlZWQgb3B0aW1pc2F0aW9uXG5cdCAgKiBQcmU6XG5cdCAgKiAgIHdlYWttYXAgICAgICAgICAgICB4IDEsNTAwLDI2MCBvcHMvc2VjIMKxMi4wMiUgKDc4IHJ1bnMgc2FtcGxlZClcblx0ICAqIFBvc3Q6XG5cdCAgKiAgIHdlYWttYXAgICAgICAgICAgICB4IDMsODgxLDM4NCBvcHMvc2VjIMKxMS40NSUgKDgyIHJ1bnMgc2FtcGxlZClcblx0ICAqL1xuXHQgIGlmICh3ZWFrTWFwRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gV2Vha01hcC5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnV2Vha01hcCc7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICogKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvaW5kZXguaHRtbCNzZWMtZGF0YXZpZXcucHJvdG90eXBlLUBAdG9zdHJpbmd0YWcpXG5cdCAgICogRVM2JDI0LjIuNC4yMSAtIERhdGFWaWV3LnByb3RvdHlwZVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJEYXRhVmlld1wiOlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwobmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcigxKSkpYGBcblx0ICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKi9cblx0ICBpZiAoZGF0YVZpZXdFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBEYXRhVmlldy5wcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnRGF0YVZpZXcnO1xuXHQgIH1cblxuXHQgIC8qICEgU3BlYyBDb25mb3JtYW5jZVxuXHQgICAqIChodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wL2luZGV4Lmh0bWwjc2VjLSVtYXBpdGVyYXRvcnByb3RvdHlwZSUtQEB0b3N0cmluZ3RhZylcblx0ICAgKiBFUzYkMjMuMS41LjIuMiAtICVNYXBJdGVyYXRvclByb3RvdHlwZSVbQEB0b1N0cmluZ1RhZ10gc2hvdWxkIGJlIFwiTWFwIEl0ZXJhdG9yXCI6XG5cdCAgICogVGVzdDogYE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChuZXcgTWFwKCkuZW50cmllcygpKWBgXG5cdCAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG5cdCAgICovXG5cdCAgaWYgKG1hcEV4aXN0cyAmJiBvYmpQcm90b3R5cGUgPT09IG1hcEl0ZXJhdG9yUHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ01hcCBJdGVyYXRvcic7XG5cdCAgfVxuXG5cdCAgLyogISBTcGVjIENvbmZvcm1hbmNlXG5cdCAgICogKGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvaW5kZXguaHRtbCNzZWMtJXNldGl0ZXJhdG9ycHJvdG90eXBlJS1AQHRvc3RyaW5ndGFnKVxuXHQgICAqIEVTNiQyMy4yLjUuMi4yIC0gJVNldEl0ZXJhdG9yUHJvdG90eXBlJVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJTZXQgSXRlcmF0b3JcIjpcblx0ICAgKiBUZXN0OiBgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ldyBTZXQoKS5lbnRyaWVzKCkpYGBcblx0ICAgKiAgLSBFZGdlIDw9MTMgPT09IFwiW29iamVjdCBPYmplY3RdXCJcblx0ICAgKi9cblx0ICBpZiAoc2V0RXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gc2V0SXRlcmF0b3JQcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnU2V0IEl0ZXJhdG9yJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy0lYXJyYXlpdGVyYXRvcnByb3RvdHlwZSUtQEB0b3N0cmluZ3RhZylcblx0ICAgKiBFUzYkMjIuMS41LjIuMiAtICVBcnJheUl0ZXJhdG9yUHJvdG90eXBlJVtAQHRvU3RyaW5nVGFnXSBzaG91bGQgYmUgXCJBcnJheSBJdGVyYXRvclwiOlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoW11bU3ltYm9sLml0ZXJhdG9yXSgpKWBgXG5cdCAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG5cdCAgICovXG5cdCAgaWYgKGFycmF5SXRlcmF0b3JFeGlzdHMgJiYgb2JqUHJvdG90eXBlID09PSBhcnJheUl0ZXJhdG9yUHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gJ0FycmF5IEl0ZXJhdG9yJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWMgQ29uZm9ybWFuY2Vcblx0ICAgKiAoaHR0cDovL3d3dy5lY21hLWludGVybmF0aW9uYWwub3JnL2VjbWEtMjYyLzYuMC9pbmRleC5odG1sI3NlYy0lc3RyaW5naXRlcmF0b3Jwcm90b3R5cGUlLUBAdG9zdHJpbmd0YWcpXG5cdCAgICogRVM2JDIxLjEuNS4yLjIgLSAlU3RyaW5nSXRlcmF0b3JQcm90b3R5cGUlW0BAdG9TdHJpbmdUYWddIHNob3VsZCBiZSBcIlN0cmluZyBJdGVyYXRvclwiOlxuXHQgICAqIFRlc3Q6IGBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoJydbU3ltYm9sLml0ZXJhdG9yXSgpKWBgXG5cdCAgICogIC0gRWRnZSA8PTEzID09PSBcIltvYmplY3QgT2JqZWN0XVwiXG5cdCAgICovXG5cdCAgaWYgKHN0cmluZ0l0ZXJhdG9yRXhpc3RzICYmIG9ialByb3RvdHlwZSA9PT0gc3RyaW5nSXRlcmF0b3JQcm90b3R5cGUpIHtcblx0ICAgIHJldHVybiAnU3RyaW5nIEl0ZXJhdG9yJztcblx0ICB9XG5cblx0ICAvKiAhIFNwZWVkIG9wdGltaXNhdGlvblxuXHQgICogUHJlOlxuXHQgICogICBvYmplY3QgZnJvbSBudWxsICAgeCAyLDQyNCwzMjAgb3BzL3NlYyDCsTEuNjclICg3NiBydW5zIHNhbXBsZWQpXG5cdCAgKiBQb3N0OlxuXHQgICogICBvYmplY3QgZnJvbSBudWxsICAgeCA1LDgzOCwwMDAgb3BzL3NlYyDCsTAuOTklICg4NCBydW5zIHNhbXBsZWQpXG5cdCAgKi9cblx0ICBpZiAob2JqUHJvdG90eXBlID09PSBudWxsKSB7XG5cdCAgICByZXR1cm4gJ09iamVjdCc7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIE9iamVjdFxuXHQgICAgLnByb3RvdHlwZVxuXHQgICAgLnRvU3RyaW5nXG5cdCAgICAuY2FsbChvYmopXG5cdCAgICAuc2xpY2UodG9TdHJpbmdMZWZ0U2xpY2VMZW5ndGgsIHRvU3RyaW5nUmlnaHRTbGljZUxlbmd0aCk7XG5cdH1cblxuXHRyZXR1cm4gdHlwZURldGVjdDtcblxuXHR9KSkpO1xuXHR9KTtcblxuXHRmdW5jdGlvbiBfc2xpY2VkVG9BcnJheShhcnIsIGkpIHtcblx0ICByZXR1cm4gX2FycmF5V2l0aEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheUxpbWl0KGFyciwgaSkgfHwgX3Vuc3VwcG9ydGVkSXRlcmFibGVUb0FycmF5KGFyciwgaSkgfHwgX25vbkl0ZXJhYmxlUmVzdCgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gX2FycmF5V2l0aEhvbGVzKGFycikge1xuXHQgIGlmIChBcnJheS5pc0FycmF5KGFycikpIHJldHVybiBhcnI7XG5cdH1cblxuXHRmdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5TGltaXQoYXJyLCBpKSB7XG5cdCAgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwidW5kZWZpbmVkXCIgfHwgIShTeW1ib2wuaXRlcmF0b3IgaW4gT2JqZWN0KGFycikpKSByZXR1cm47XG5cdCAgdmFyIF9hcnIgPSBbXTtcblx0ICB2YXIgX24gPSB0cnVlO1xuXHQgIHZhciBfZCA9IGZhbHNlO1xuXHQgIHZhciBfZSA9IHVuZGVmaW5lZDtcblxuXHQgIHRyeSB7XG5cdCAgICBmb3IgKHZhciBfaSA9IGFycltTeW1ib2wuaXRlcmF0b3JdKCksIF9zOyAhKF9uID0gKF9zID0gX2kubmV4dCgpKS5kb25lKTsgX24gPSB0cnVlKSB7XG5cdCAgICAgIF9hcnIucHVzaChfcy52YWx1ZSk7XG5cblx0ICAgICAgaWYgKGkgJiYgX2Fyci5sZW5ndGggPT09IGkpIGJyZWFrO1xuXHQgICAgfVxuXHQgIH0gY2F0Y2ggKGVycikge1xuXHQgICAgX2QgPSB0cnVlO1xuXHQgICAgX2UgPSBlcnI7XG5cdCAgfSBmaW5hbGx5IHtcblx0ICAgIHRyeSB7XG5cdCAgICAgIGlmICghX24gJiYgX2lbXCJyZXR1cm5cIl0gIT0gbnVsbCkgX2lbXCJyZXR1cm5cIl0oKTtcblx0ICAgIH0gZmluYWxseSB7XG5cdCAgICAgIGlmIChfZCkgdGhyb3cgX2U7XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgcmV0dXJuIF9hcnI7XG5cdH1cblxuXHRmdW5jdGlvbiBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobywgbWluTGVuKSB7XG5cdCAgaWYgKCFvKSByZXR1cm47XG5cdCAgaWYgKHR5cGVvZiBvID09PSBcInN0cmluZ1wiKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkobywgbWluTGVuKTtcblx0ICB2YXIgbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSk7XG5cdCAgaWYgKG4gPT09IFwiT2JqZWN0XCIgJiYgby5jb25zdHJ1Y3RvcikgbiA9IG8uY29uc3RydWN0b3IubmFtZTtcblx0ICBpZiAobiA9PT0gXCJNYXBcIiB8fCBuID09PSBcIlNldFwiKSByZXR1cm4gQXJyYXkuZnJvbShvKTtcblx0ICBpZiAobiA9PT0gXCJBcmd1bWVudHNcIiB8fCAvXig/OlVpfEkpbnQoPzo4fDE2fDMyKSg/OkNsYW1wZWQpP0FycmF5JC8udGVzdChuKSkgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG5cdH1cblxuXHRmdW5jdGlvbiBfYXJyYXlMaWtlVG9BcnJheShhcnIsIGxlbikge1xuXHQgIGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoO1xuXG5cdCAgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkobGVuKTsgaSA8IGxlbjsgaSsrKSBhcnIyW2ldID0gYXJyW2ldO1xuXG5cdCAgcmV0dXJuIGFycjI7XG5cdH1cblxuXHRmdW5jdGlvbiBfbm9uSXRlcmFibGVSZXN0KCkge1xuXHQgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gZGVzdHJ1Y3R1cmUgbm9uLWl0ZXJhYmxlIGluc3RhbmNlLlxcbkluIG9yZGVyIHRvIGJlIGl0ZXJhYmxlLCBub24tYXJyYXkgb2JqZWN0cyBtdXN0IGhhdmUgYSBbU3ltYm9sLml0ZXJhdG9yXSgpIG1ldGhvZC5cIik7XG5cdH1cblxuXHR2YXIgYW5zaUNvbG9ycyA9IHtcblx0ICBib2xkOiBbJzEnLCAnMjInXSxcblx0ICBkaW06IFsnMicsICcyMiddLFxuXHQgIGl0YWxpYzogWyczJywgJzIzJ10sXG5cdCAgdW5kZXJsaW5lOiBbJzQnLCAnMjQnXSxcblx0ICAvLyA1ICYgNiBhcmUgYmxpbmtpbmdcblx0ICBpbnZlcnNlOiBbJzcnLCAnMjcnXSxcblx0ICBoaWRkZW46IFsnOCcsICcyOCddLFxuXHQgIHN0cmlrZTogWyc5JywgJzI5J10sXG5cdCAgLy8gMTAtMjAgYXJlIGZvbnRzXG5cdCAgLy8gMjEtMjkgYXJlIHJlc2V0cyBmb3IgMS05XG5cdCAgYmxhY2s6IFsnMzAnLCAnMzknXSxcblx0ICByZWQ6IFsnMzEnLCAnMzknXSxcblx0ICBncmVlbjogWyczMicsICczOSddLFxuXHQgIHllbGxvdzogWyczMycsICczOSddLFxuXHQgIGJsdWU6IFsnMzQnLCAnMzknXSxcblx0ICBtYWdlbnRhOiBbJzM1JywgJzM5J10sXG5cdCAgY3lhbjogWyczNicsICczOSddLFxuXHQgIHdoaXRlOiBbJzM3JywgJzM5J10sXG5cdCAgYnJpZ2h0YmxhY2s6IFsnMzA7MScsICczOSddLFxuXHQgIGJyaWdodHJlZDogWyczMTsxJywgJzM5J10sXG5cdCAgYnJpZ2h0Z3JlZW46IFsnMzI7MScsICczOSddLFxuXHQgIGJyaWdodHllbGxvdzogWyczMzsxJywgJzM5J10sXG5cdCAgYnJpZ2h0Ymx1ZTogWyczNDsxJywgJzM5J10sXG5cdCAgYnJpZ2h0bWFnZW50YTogWyczNTsxJywgJzM5J10sXG5cdCAgYnJpZ2h0Y3lhbjogWyczNjsxJywgJzM5J10sXG5cdCAgYnJpZ2h0d2hpdGU6IFsnMzc7MScsICczOSddLFxuXHQgIGdyZXk6IFsnOTAnLCAnMzknXVxuXHR9O1xuXHR2YXIgc3R5bGVzID0ge1xuXHQgIHNwZWNpYWw6ICdjeWFuJyxcblx0ICBudW1iZXI6ICd5ZWxsb3cnLFxuXHQgIGJvb2xlYW46ICd5ZWxsb3cnLFxuXHQgIHVuZGVmaW5lZDogJ2dyZXknLFxuXHQgIG51bGw6ICdib2xkJyxcblx0ICBzdHJpbmc6ICdncmVlbicsXG5cdCAgc3ltYm9sOiAnZ3JlZW4nLFxuXHQgIGRhdGU6ICdtYWdlbnRhJyxcblx0ICByZWdleHA6ICdyZWQnXG5cdH07XG5cdHZhciB0cnVuY2F0b3IgPSAn4oCmJztcblxuXHRmdW5jdGlvbiBjb2xvcmlzZSh2YWx1ZSwgc3R5bGVUeXBlKSB7XG5cdCAgdmFyIGNvbG9yID0gYW5zaUNvbG9yc1tzdHlsZXNbc3R5bGVUeXBlXV0gfHwgYW5zaUNvbG9yc1tzdHlsZVR5cGVdO1xuXG5cdCAgaWYgKCFjb2xvcikge1xuXHQgICAgcmV0dXJuIFN0cmluZyh2YWx1ZSk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIFwiXFx4MUJbXCIuY29uY2F0KGNvbG9yWzBdLCBcIm1cIikuY29uY2F0KFN0cmluZyh2YWx1ZSksIFwiXFx4MUJbXCIpLmNvbmNhdChjb2xvclsxXSwgXCJtXCIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbm9ybWFsaXNlT3B0aW9ucygpIHtcblx0ICB2YXIgX3JlZiA9IGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzBdIDoge30sXG5cdCAgICAgIF9yZWYkc2hvd0hpZGRlbiA9IF9yZWYuc2hvd0hpZGRlbixcblx0ICAgICAgc2hvd0hpZGRlbiA9IF9yZWYkc2hvd0hpZGRlbiA9PT0gdm9pZCAwID8gZmFsc2UgOiBfcmVmJHNob3dIaWRkZW4sXG5cdCAgICAgIF9yZWYkZGVwdGggPSBfcmVmLmRlcHRoLFxuXHQgICAgICBkZXB0aCA9IF9yZWYkZGVwdGggPT09IHZvaWQgMCA/IDIgOiBfcmVmJGRlcHRoLFxuXHQgICAgICBfcmVmJGNvbG9ycyA9IF9yZWYuY29sb3JzLFxuXHQgICAgICBjb2xvcnMgPSBfcmVmJGNvbG9ycyA9PT0gdm9pZCAwID8gZmFsc2UgOiBfcmVmJGNvbG9ycyxcblx0ICAgICAgX3JlZiRjdXN0b21JbnNwZWN0ID0gX3JlZi5jdXN0b21JbnNwZWN0LFxuXHQgICAgICBjdXN0b21JbnNwZWN0ID0gX3JlZiRjdXN0b21JbnNwZWN0ID09PSB2b2lkIDAgPyB0cnVlIDogX3JlZiRjdXN0b21JbnNwZWN0LFxuXHQgICAgICBfcmVmJHNob3dQcm94eSA9IF9yZWYuc2hvd1Byb3h5LFxuXHQgICAgICBzaG93UHJveHkgPSBfcmVmJHNob3dQcm94eSA9PT0gdm9pZCAwID8gZmFsc2UgOiBfcmVmJHNob3dQcm94eSxcblx0ICAgICAgX3JlZiRtYXhBcnJheUxlbmd0aCA9IF9yZWYubWF4QXJyYXlMZW5ndGgsXG5cdCAgICAgIG1heEFycmF5TGVuZ3RoID0gX3JlZiRtYXhBcnJheUxlbmd0aCA9PT0gdm9pZCAwID8gSW5maW5pdHkgOiBfcmVmJG1heEFycmF5TGVuZ3RoLFxuXHQgICAgICBfcmVmJGJyZWFrTGVuZ3RoID0gX3JlZi5icmVha0xlbmd0aCxcblx0ICAgICAgYnJlYWtMZW5ndGggPSBfcmVmJGJyZWFrTGVuZ3RoID09PSB2b2lkIDAgPyBJbmZpbml0eSA6IF9yZWYkYnJlYWtMZW5ndGgsXG5cdCAgICAgIF9yZWYkc2VlbiA9IF9yZWYuc2Vlbixcblx0ICAgICAgc2VlbiA9IF9yZWYkc2VlbiA9PT0gdm9pZCAwID8gW10gOiBfcmVmJHNlZW4sXG5cdCAgICAgIF9yZWYkdHJ1bmNhdGUgPSBfcmVmLnRydW5jYXRlLFxuXHQgICAgICB0cnVuY2F0ZSA9IF9yZWYkdHJ1bmNhdGUgPT09IHZvaWQgMCA/IEluZmluaXR5IDogX3JlZiR0cnVuY2F0ZSxcblx0ICAgICAgX3JlZiRzdHlsaXplID0gX3JlZi5zdHlsaXplLFxuXHQgICAgICBzdHlsaXplID0gX3JlZiRzdHlsaXplID09PSB2b2lkIDAgPyBTdHJpbmcgOiBfcmVmJHN0eWxpemU7XG5cblx0ICB2YXIgb3B0aW9ucyA9IHtcblx0ICAgIHNob3dIaWRkZW46IEJvb2xlYW4oc2hvd0hpZGRlbiksXG5cdCAgICBkZXB0aDogTnVtYmVyKGRlcHRoKSxcblx0ICAgIGNvbG9yczogQm9vbGVhbihjb2xvcnMpLFxuXHQgICAgY3VzdG9tSW5zcGVjdDogQm9vbGVhbihjdXN0b21JbnNwZWN0KSxcblx0ICAgIHNob3dQcm94eTogQm9vbGVhbihzaG93UHJveHkpLFxuXHQgICAgbWF4QXJyYXlMZW5ndGg6IE51bWJlcihtYXhBcnJheUxlbmd0aCksXG5cdCAgICBicmVha0xlbmd0aDogTnVtYmVyKGJyZWFrTGVuZ3RoKSxcblx0ICAgIHRydW5jYXRlOiBOdW1iZXIodHJ1bmNhdGUpLFxuXHQgICAgc2Vlbjogc2Vlbixcblx0ICAgIHN0eWxpemU6IHN0eWxpemVcblx0ICB9O1xuXG5cdCAgaWYgKG9wdGlvbnMuY29sb3JzKSB7XG5cdCAgICBvcHRpb25zLnN0eWxpemUgPSBjb2xvcmlzZTtcblx0ICB9XG5cblx0ICByZXR1cm4gb3B0aW9ucztcblx0fVxuXHRmdW5jdGlvbiB0cnVuY2F0ZShzdHJpbmcsIGxlbmd0aCkge1xuXHQgIHZhciB0YWlsID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB0cnVuY2F0b3I7XG5cdCAgc3RyaW5nID0gU3RyaW5nKHN0cmluZyk7XG5cdCAgdmFyIHRhaWxMZW5ndGggPSB0YWlsLmxlbmd0aDtcblx0ICB2YXIgc3RyaW5nTGVuZ3RoID0gc3RyaW5nLmxlbmd0aDtcblxuXHQgIGlmICh0YWlsTGVuZ3RoID4gbGVuZ3RoICYmIHN0cmluZ0xlbmd0aCA+IHRhaWxMZW5ndGgpIHtcblx0ICAgIHJldHVybiB0YWlsO1xuXHQgIH1cblxuXHQgIGlmIChzdHJpbmdMZW5ndGggPiBsZW5ndGggJiYgc3RyaW5nTGVuZ3RoID4gdGFpbExlbmd0aCkge1xuXHQgICAgcmV0dXJuIFwiXCIuY29uY2F0KHN0cmluZy5zbGljZSgwLCBsZW5ndGggLSB0YWlsTGVuZ3RoKSkuY29uY2F0KHRhaWwpO1xuXHQgIH1cblxuXHQgIHJldHVybiBzdHJpbmc7XG5cdH0gLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcblxuXHRmdW5jdGlvbiBpbnNwZWN0TGlzdChsaXN0LCBvcHRpb25zLCBpbnNwZWN0SXRlbSkge1xuXHQgIHZhciBzZXBhcmF0b3IgPSBhcmd1bWVudHMubGVuZ3RoID4gMyAmJiBhcmd1bWVudHNbM10gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1szXSA6ICcsICc7XG5cdCAgaW5zcGVjdEl0ZW0gPSBpbnNwZWN0SXRlbSB8fCBvcHRpb25zLmluc3BlY3Q7XG5cdCAgdmFyIHNpemUgPSBsaXN0Lmxlbmd0aDtcblx0ICBpZiAoc2l6ZSA9PT0gMCkgcmV0dXJuICcnO1xuXHQgIHZhciBvcmlnaW5hbExlbmd0aCA9IG9wdGlvbnMudHJ1bmNhdGU7XG5cdCAgdmFyIG91dHB1dCA9ICcnO1xuXHQgIHZhciBwZWVrID0gJyc7XG5cdCAgdmFyIHRydW5jYXRlZCA9ICcnO1xuXG5cdCAgZm9yICh2YXIgaSA9IDA7IGkgPCBzaXplOyBpICs9IDEpIHtcblx0ICAgIHZhciBsYXN0ID0gaSArIDEgPT09IGxpc3QubGVuZ3RoO1xuXHQgICAgdmFyIHNlY29uZFRvTGFzdCA9IGkgKyAyID09PSBsaXN0Lmxlbmd0aDtcblx0ICAgIHRydW5jYXRlZCA9IFwiXCIuY29uY2F0KHRydW5jYXRvciwgXCIoXCIpLmNvbmNhdChsaXN0Lmxlbmd0aCAtIGksIFwiKVwiKTtcblx0ICAgIHZhciB2YWx1ZSA9IGxpc3RbaV07IC8vIElmIHRoZXJlIGlzIG1vcmUgdGhhbiBvbmUgcmVtYWluaW5nIHdlIG5lZWQgdG8gYWNjb3VudCBmb3IgYSBzZXBhcmF0b3Igb2YgYCwgYFxuXG5cdCAgICBvcHRpb25zLnRydW5jYXRlID0gb3JpZ2luYWxMZW5ndGggLSBvdXRwdXQubGVuZ3RoIC0gKGxhc3QgPyAwIDogc2VwYXJhdG9yLmxlbmd0aCk7XG5cdCAgICB2YXIgc3RyaW5nID0gcGVlayB8fCBpbnNwZWN0SXRlbSh2YWx1ZSwgb3B0aW9ucykgKyAobGFzdCA/ICcnIDogc2VwYXJhdG9yKTtcblx0ICAgIHZhciBuZXh0TGVuZ3RoID0gb3V0cHV0Lmxlbmd0aCArIHN0cmluZy5sZW5ndGg7XG5cdCAgICB2YXIgdHJ1bmNhdGVkTGVuZ3RoID0gbmV4dExlbmd0aCArIHRydW5jYXRlZC5sZW5ndGg7IC8vIElmIHRoaXMgaXMgdGhlIGxhc3QgZWxlbWVudCwgYW5kIGFkZGluZyBpdCB3b3VsZFxuXHQgICAgLy8gdGFrZSB1cyBvdmVyIGxlbmd0aCwgYnV0IGFkZGluZyB0aGUgdHJ1bmNhdG9yIHdvdWxkbid0IC0gdGhlbiBicmVhayBub3dcblxuXHQgICAgaWYgKGxhc3QgJiYgbmV4dExlbmd0aCA+IG9yaWdpbmFsTGVuZ3RoICYmIG91dHB1dC5sZW5ndGggKyB0cnVuY2F0ZWQubGVuZ3RoIDw9IG9yaWdpbmFsTGVuZ3RoKSB7XG5cdCAgICAgIGJyZWFrO1xuXHQgICAgfSAvLyBJZiB0aGlzIGlzbid0IHRoZSBsYXN0IG9yIHNlY29uZCB0byBsYXN0IGVsZW1lbnQgdG8gc2Nhbixcblx0ICAgIC8vIGJ1dCB0aGUgc3RyaW5nIGlzIGFscmVhZHkgb3ZlciBsZW5ndGggdGhlbiBicmVhayBoZXJlXG5cblxuXHQgICAgaWYgKCFsYXN0ICYmICFzZWNvbmRUb0xhc3QgJiYgdHJ1bmNhdGVkTGVuZ3RoID4gb3JpZ2luYWxMZW5ndGgpIHtcblx0ICAgICAgYnJlYWs7XG5cdCAgICB9IC8vIFBlZWsgYXQgdGhlIG5leHQgc3RyaW5nIHRvIGRldGVybWluZSBpZiB3ZSBzaG91bGRcblx0ICAgIC8vIGJyZWFrIGVhcmx5IGJlZm9yZSBhZGRpbmcgdGhpcyBpdGVtIHRvIHRoZSBvdXRwdXRcblxuXG5cdCAgICBwZWVrID0gbGFzdCA/ICcnIDogaW5zcGVjdEl0ZW0obGlzdFtpICsgMV0sIG9wdGlvbnMpICsgKHNlY29uZFRvTGFzdCA/ICcnIDogc2VwYXJhdG9yKTsgLy8gSWYgd2UgaGF2ZSBvbmUgZWxlbWVudCBsZWZ0LCBidXQgdGhpcyBlbGVtZW50IGFuZFxuXHQgICAgLy8gdGhlIG5leHQgdGFrZXMgb3ZlciBsZW5ndGgsIHRoZSBicmVhayBlYXJseVxuXG5cdCAgICBpZiAoIWxhc3QgJiYgc2Vjb25kVG9MYXN0ICYmIHRydW5jYXRlZExlbmd0aCA+IG9yaWdpbmFsTGVuZ3RoICYmIG5leHRMZW5ndGggKyBwZWVrLmxlbmd0aCA+IG9yaWdpbmFsTGVuZ3RoKSB7XG5cdCAgICAgIGJyZWFrO1xuXHQgICAgfVxuXG5cdCAgICBvdXRwdXQgKz0gc3RyaW5nOyAvLyBJZiB0aGUgbmV4dCBlbGVtZW50IHRha2VzIHVzIHRvIGxlbmd0aCAtXG5cdCAgICAvLyBidXQgdGhlcmUgYXJlIG1vcmUgYWZ0ZXIgdGhhdCwgdGhlbiB3ZSBzaG91bGQgdHJ1bmNhdGUgbm93XG5cblx0ICAgIGlmICghbGFzdCAmJiAhc2Vjb25kVG9MYXN0ICYmIG5leHRMZW5ndGggKyBwZWVrLmxlbmd0aCA+PSBvcmlnaW5hbExlbmd0aCkge1xuXHQgICAgICB0cnVuY2F0ZWQgPSBcIlwiLmNvbmNhdCh0cnVuY2F0b3IsIFwiKFwiKS5jb25jYXQobGlzdC5sZW5ndGggLSBpIC0gMSwgXCIpXCIpO1xuXHQgICAgICBicmVhaztcblx0ICAgIH1cblxuXHQgICAgdHJ1bmNhdGVkID0gJyc7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KG91dHB1dCkuY29uY2F0KHRydW5jYXRlZCk7XG5cdH1cblx0ZnVuY3Rpb24gaW5zcGVjdFByb3BlcnR5KF9yZWYyLCBvcHRpb25zKSB7XG5cdCAgdmFyIF9yZWYzID0gX3NsaWNlZFRvQXJyYXkoX3JlZjIsIDIpLFxuXHQgICAgICBrZXkgPSBfcmVmM1swXSxcblx0ICAgICAgdmFsdWUgPSBfcmVmM1sxXTtcblxuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gMjtcblxuXHQgIGlmICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyAmJiB0eXBlb2Yga2V5ICE9PSAnbnVtYmVyJykge1xuXHQgICAga2V5ID0gXCJbXCIuY29uY2F0KG9wdGlvbnMuaW5zcGVjdChrZXksIG9wdGlvbnMpLCBcIl1cIik7XG5cdCAgfVxuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSBrZXkubGVuZ3RoO1xuXHQgIHZhbHVlID0gb3B0aW9ucy5pbnNwZWN0KHZhbHVlLCBvcHRpb25zKTtcblx0ICByZXR1cm4gXCJcIi5jb25jYXQoa2V5LCBcIjogXCIpLmNvbmNhdCh2YWx1ZSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0QXJyYXkoYXJyYXksIG9wdGlvbnMpIHtcblx0ICAvLyBPYmplY3Qua2V5cyB3aWxsIGFsd2F5cyBvdXRwdXQgdGhlIEFycmF5IGluZGljZXMgZmlyc3QsIHNvIHdlIGNhbiBzbGljZSBieVxuXHQgIC8vIGBhcnJheS5sZW5ndGhgIHRvIGdldCBub24taW5kZXggcHJvcGVydGllc1xuXHQgIHZhciBub25JbmRleFByb3BlcnRpZXMgPSBPYmplY3Qua2V5cyhhcnJheSkuc2xpY2UoYXJyYXkubGVuZ3RoKTtcblx0ICBpZiAoIWFycmF5Lmxlbmd0aCAmJiAhbm9uSW5kZXhQcm9wZXJ0aWVzLmxlbmd0aCkgcmV0dXJuICdbXSc7XG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSA0O1xuXHQgIHZhciBsaXN0Q29udGVudHMgPSBpbnNwZWN0TGlzdChhcnJheSwgb3B0aW9ucyk7XG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSBsaXN0Q29udGVudHMubGVuZ3RoO1xuXHQgIHZhciBwcm9wZXJ0eUNvbnRlbnRzID0gJyc7XG5cblx0ICBpZiAobm9uSW5kZXhQcm9wZXJ0aWVzLmxlbmd0aCkge1xuXHQgICAgcHJvcGVydHlDb250ZW50cyA9IGluc3BlY3RMaXN0KG5vbkluZGV4UHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgICByZXR1cm4gW2tleSwgYXJyYXlba2V5XV07XG5cdCAgICB9KSwgb3B0aW9ucywgaW5zcGVjdFByb3BlcnR5KTtcblx0ICB9XG5cblx0ICByZXR1cm4gXCJbIFwiLmNvbmNhdChsaXN0Q29udGVudHMpLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzID8gXCIsIFwiLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzKSA6ICcnLCBcIiBdXCIpO1xuXHR9XG5cblx0LyogIVxuXHQgKiBDaGFpIC0gZ2V0RnVuY05hbWUgdXRpbGl0eVxuXHQgKiBDb3B5cmlnaHQoYykgMjAxMi0yMDE2IEpha2UgTHVlciA8amFrZUBhbG9naWNhbHBhcmFkb3guY29tPlxuXHQgKiBNSVQgTGljZW5zZWRcblx0ICovXG5cblx0LyoqXG5cdCAqICMjIyAuZ2V0RnVuY05hbWUoY29uc3RydWN0b3JGbilcblx0ICpcblx0ICogUmV0dXJucyB0aGUgbmFtZSBvZiBhIGZ1bmN0aW9uLlxuXHQgKiBXaGVuIGEgbm9uLWZ1bmN0aW9uIGluc3RhbmNlIGlzIHBhc3NlZCwgcmV0dXJucyBgbnVsbGAuXG5cdCAqIFRoaXMgYWxzbyBpbmNsdWRlcyBhIHBvbHlmaWxsIGZ1bmN0aW9uIGlmIGBhRnVuYy5uYW1lYCBpcyBub3QgZGVmaW5lZC5cblx0ICpcblx0ICogQG5hbWUgZ2V0RnVuY05hbWVcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuY3Rcblx0ICogQG5hbWVzcGFjZSBVdGlsc1xuXHQgKiBAYXBpIHB1YmxpY1xuXHQgKi9cblxuXHR2YXIgdG9TdHJpbmcgPSBGdW5jdGlvbi5wcm90b3R5cGUudG9TdHJpbmc7XG5cdHZhciBmdW5jdGlvbk5hbWVNYXRjaCA9IC9cXHMqZnVuY3Rpb24oPzpcXHN8XFxzKlxcL1xcKlteKD86KlxcLyldK1xcKlxcL1xccyopKihbXlxcc1xcKFxcL10rKS87XG5cdGZ1bmN0aW9uIGdldEZ1bmNOYW1lKGFGdW5jKSB7XG5cdCAgaWYgKHR5cGVvZiBhRnVuYyAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcmV0dXJuIG51bGw7XG5cdCAgfVxuXG5cdCAgdmFyIG5hbWUgPSAnJztcblx0ICBpZiAodHlwZW9mIEZ1bmN0aW9uLnByb3RvdHlwZS5uYW1lID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgYUZ1bmMubmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgIC8vIEhlcmUgd2UgcnVuIGEgcG9seWZpbGwgaWYgRnVuY3Rpb24gZG9lcyBub3Qgc3VwcG9ydCB0aGUgYG5hbWVgIHByb3BlcnR5IGFuZCBpZiBhRnVuYy5uYW1lIGlzIG5vdCBkZWZpbmVkXG5cdCAgICB2YXIgbWF0Y2ggPSB0b1N0cmluZy5jYWxsKGFGdW5jKS5tYXRjaChmdW5jdGlvbk5hbWVNYXRjaCk7XG5cdCAgICBpZiAobWF0Y2gpIHtcblx0ICAgICAgbmFtZSA9IG1hdGNoWzFdO1xuXHQgICAgfVxuXHQgIH0gZWxzZSB7XG5cdCAgICAvLyBJZiB3ZSd2ZSBnb3QgYSBgbmFtZWAgcHJvcGVydHkgd2UganVzdCB1c2UgaXRcblx0ICAgIG5hbWUgPSBhRnVuYy5uYW1lO1xuXHQgIH1cblxuXHQgIHJldHVybiBuYW1lO1xuXHR9XG5cblx0dmFyIGdldEZ1bmNOYW1lXzEgPSBnZXRGdW5jTmFtZTtcblxuXHR2YXIgZ2V0QXJyYXlOYW1lID0gZnVuY3Rpb24gZ2V0QXJyYXlOYW1lKGFycmF5KSB7XG5cdCAgLy8gV2UgbmVlZCB0byBzcGVjaWFsIGNhc2UgTm9kZS5qcycgQnVmZmVycywgd2hpY2ggcmVwb3J0IHRvIGJlIFVpbnQ4QXJyYXlcblx0ICBpZiAodHlwZW9mIEJ1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJiBhcnJheSBpbnN0YW5jZW9mIEJ1ZmZlcikge1xuXHQgICAgcmV0dXJuICdCdWZmZXInO1xuXHQgIH1cblxuXHQgIGlmIChhcnJheVtTeW1ib2wudG9TdHJpbmdUYWddKSB7XG5cdCAgICByZXR1cm4gYXJyYXlbU3ltYm9sLnRvU3RyaW5nVGFnXTtcblx0ICB9XG5cblx0ICByZXR1cm4gZ2V0RnVuY05hbWVfMShhcnJheS5jb25zdHJ1Y3Rvcik7XG5cdH07XG5cblx0ZnVuY3Rpb24gaW5zcGVjdFR5cGVkQXJyYXkoYXJyYXksIG9wdGlvbnMpIHtcblx0ICB2YXIgbmFtZSA9IGdldEFycmF5TmFtZShhcnJheSk7XG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSBuYW1lLmxlbmd0aCArIDQ7IC8vIE9iamVjdC5rZXlzIHdpbGwgYWx3YXlzIG91dHB1dCB0aGUgQXJyYXkgaW5kaWNlcyBmaXJzdCwgc28gd2UgY2FuIHNsaWNlIGJ5XG5cdCAgLy8gYGFycmF5Lmxlbmd0aGAgdG8gZ2V0IG5vbi1pbmRleCBwcm9wZXJ0aWVzXG5cblx0ICB2YXIgbm9uSW5kZXhQcm9wZXJ0aWVzID0gT2JqZWN0LmtleXMoYXJyYXkpLnNsaWNlKGFycmF5Lmxlbmd0aCk7XG5cdCAgaWYgKCFhcnJheS5sZW5ndGggJiYgIW5vbkluZGV4UHJvcGVydGllcy5sZW5ndGgpIHJldHVybiBcIlwiLmNvbmNhdChuYW1lLCBcIltdXCIpOyAvLyBBcyB3ZSBrbm93IFR5cGVkQXJyYXlzIG9ubHkgY29udGFpbiBVbnNpZ25lZCBJbnRlZ2Vycywgd2UgY2FuIHNraXAgaW5zcGVjdGluZyBlYWNoIG9uZSBhbmQgc2ltcGx5XG5cdCAgLy8gc3R5bGlzZSB0aGUgdG9TdHJpbmcoKSB2YWx1ZSBvZiB0aGVtXG5cblx0ICB2YXIgb3V0cHV0ID0gJyc7XG5cblx0ICBmb3IgKHZhciBpID0gMDsgaSA8IGFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdCAgICB2YXIgc3RyaW5nID0gXCJcIi5jb25jYXQob3B0aW9ucy5zdHlsaXplKHRydW5jYXRlKGFycmF5W2ldLCBvcHRpb25zLnRydW5jYXRlKSwgJ251bWJlcicpKS5jb25jYXQoaSA9PT0gYXJyYXkubGVuZ3RoIC0gMSA/ICcnIDogJywgJyk7XG5cdCAgICBvcHRpb25zLnRydW5jYXRlIC09IHN0cmluZy5sZW5ndGg7XG5cblx0ICAgIGlmIChhcnJheVtpXSAhPT0gYXJyYXkubGVuZ3RoICYmIG9wdGlvbnMudHJ1bmNhdGUgPD0gMykge1xuXHQgICAgICBvdXRwdXQgKz0gXCJcIi5jb25jYXQodHJ1bmNhdG9yLCBcIihcIikuY29uY2F0KGFycmF5Lmxlbmd0aCAtIGFycmF5W2ldICsgMSwgXCIpXCIpO1xuXHQgICAgICBicmVhaztcblx0ICAgIH1cblxuXHQgICAgb3V0cHV0ICs9IHN0cmluZztcblx0ICB9XG5cblx0ICB2YXIgcHJvcGVydHlDb250ZW50cyA9ICcnO1xuXG5cdCAgaWYgKG5vbkluZGV4UHJvcGVydGllcy5sZW5ndGgpIHtcblx0ICAgIHByb3BlcnR5Q29udGVudHMgPSBpbnNwZWN0TGlzdChub25JbmRleFByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcblx0ICAgICAgcmV0dXJuIFtrZXksIGFycmF5W2tleV1dO1xuXHQgICAgfSksIG9wdGlvbnMsIGluc3BlY3RQcm9wZXJ0eSk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KG5hbWUsIFwiWyBcIikuY29uY2F0KG91dHB1dCkuY29uY2F0KHByb3BlcnR5Q29udGVudHMgPyBcIiwgXCIuY29uY2F0KHByb3BlcnR5Q29udGVudHMpIDogJycsIFwiIF1cIik7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0RGF0ZShkYXRlT2JqZWN0LCBvcHRpb25zKSB7XG5cdCAgLy8gSWYgd2UgbmVlZCB0byAtIHRydW5jYXRlIHRoZSB0aW1lIHBvcnRpb24sIGJ1dCBuZXZlciB0aGUgZGF0ZVxuXHQgIHZhciBzcGxpdCA9IGRhdGVPYmplY3QudG9KU09OKCkuc3BsaXQoJ1QnKTtcblx0ICB2YXIgZGF0ZSA9IHNwbGl0WzBdO1xuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCJcIi5jb25jYXQoZGF0ZSwgXCJUXCIpLmNvbmNhdCh0cnVuY2F0ZShzcGxpdFsxXSwgb3B0aW9ucy50cnVuY2F0ZSAtIGRhdGUubGVuZ3RoIC0gMSkpLCAnZGF0ZScpO1xuXHR9XG5cblx0dmFyIHRvU3RyaW5nJDEgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cdHZhciBnZXRGdW5jdGlvbk5hbWUgPSBmdW5jdGlvbihmbikge1xuXHQgIGlmICh0b1N0cmluZyQxLmNhbGwoZm4pICE9PSAnW29iamVjdCBGdW5jdGlvbl0nKSByZXR1cm4gbnVsbFxuXHQgIGlmIChmbi5uYW1lKSByZXR1cm4gZm4ubmFtZVxuXHQgIHRyeSB7XG5cdFx0ICB2YXIgbmFtZSA9IC9eXFxzKmZ1bmN0aW9uXFxzKihbXlxcKF0qKS9pbS5leGVjKGZuLnRvU3RyaW5nKCkpWzFdO1xuXHQgIH0gY2F0Y2ggKCBlICkgeyByZXR1cm4gJ2Fub255bW91cycgfTtcblx0ICByZXR1cm4gbmFtZSB8fCAnYW5vbnltb3VzJ1xuXHR9O1xuXG5cdGZ1bmN0aW9uIGluc3BlY3RGdW5jdGlvbihmdW5jLCBvcHRpb25zKSB7XG5cdCAgdmFyIG5hbWUgPSBnZXRGdW5jdGlvbk5hbWUoZnVuYyk7XG5cblx0ICBpZiAobmFtZSA9PT0gJ2Fub255bW91cycpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ1tGdW5jdGlvbl0nLCAnc3BlY2lhbCcpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCJbRnVuY3Rpb24gXCIuY29uY2F0KHRydW5jYXRlKG5hbWUsIG9wdGlvbnMudHJ1bmNhdGUgLSAxMSksIFwiXVwiKSwgJ3NwZWNpYWwnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RNYXBFbnRyeShfcmVmLCBvcHRpb25zKSB7XG5cdCAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMiksXG5cdCAgICAgIGtleSA9IF9yZWYyWzBdLFxuXHQgICAgICB2YWx1ZSA9IF9yZWYyWzFdO1xuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSA0O1xuXHQgIGtleSA9IG9wdGlvbnMuaW5zcGVjdChrZXksIG9wdGlvbnMpO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0ga2V5Lmxlbmd0aDtcblx0ICB2YWx1ZSA9IG9wdGlvbnMuaW5zcGVjdCh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KGtleSwgXCIgPT4gXCIpLmNvbmNhdCh2YWx1ZSk7XG5cdH0gLy8gSUUxMSBkb2Vzbid0IHN1cHBvcnQgYG1hcC5lbnRyaWVzKClgXG5cblxuXHRmdW5jdGlvbiBtYXBUb0VudHJpZXMobWFwKSB7XG5cdCAgdmFyIGVudHJpZXMgPSBbXTtcblx0ICBtYXAuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuXHQgICAgZW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSk7XG5cdCAgfSk7XG5cdCAgcmV0dXJuIGVudHJpZXM7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0TWFwKG1hcCwgb3B0aW9ucykge1xuXHQgIHZhciBzaXplID0gbWFwLnNpemUgLSAxO1xuXG5cdCAgaWYgKHNpemUgPD0gMCkge1xuXHQgICAgcmV0dXJuICdNYXB7fSc7XG5cdCAgfVxuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSA3O1xuXHQgIHJldHVybiBcIk1hcHsgXCIuY29uY2F0KGluc3BlY3RMaXN0KG1hcFRvRW50cmllcyhtYXApLCBvcHRpb25zLCBpbnNwZWN0TWFwRW50cnkpLCBcIiB9XCIpO1xuXHR9XG5cblx0dmFyIGlzTmFOID0gTnVtYmVyLmlzTmFOIHx8IGZ1bmN0aW9uIChpKSB7XG5cdCAgcmV0dXJuIGkgIT09IGk7XG5cdH07IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tc2VsZi1jb21wYXJlXG5cblxuXHRmdW5jdGlvbiBpbnNwZWN0TnVtYmVyKG51bWJlciwgb3B0aW9ucykge1xuXHQgIGlmIChpc05hTihudW1iZXIpKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKCdOYU4nLCAnbnVtYmVyJyk7XG5cdCAgfVxuXG5cdCAgaWYgKG51bWJlciA9PT0gSW5maW5pdHkpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ0luZmluaXR5JywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIGlmIChudW1iZXIgPT09IC1JbmZpbml0eSkge1xuXHQgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZSgnLUluZmluaXR5JywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIGlmIChudW1iZXIgPT09IDApIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoMSAvIG51bWJlciA9PT0gSW5maW5pdHkgPyAnKzAnIDogJy0wJywgJ251bWJlcicpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUodHJ1bmNhdGUobnVtYmVyLCBvcHRpb25zLnRydW5jYXRlKSwgJ251bWJlcicpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zcGVjdFJlZ0V4cCh2YWx1ZSwgb3B0aW9ucykge1xuXHQgIHZhciBmbGFncyA9IHZhbHVlLnRvU3RyaW5nKCkuc3BsaXQoJy8nKVsyXTtcblx0ICB2YXIgc291cmNlTGVuZ3RoID0gb3B0aW9ucy50cnVuY2F0ZSAtICgyICsgZmxhZ3MubGVuZ3RoKTtcblx0ICB2YXIgc291cmNlID0gdmFsdWUuc291cmNlO1xuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCIvXCIuY29uY2F0KHRydW5jYXRlKHNvdXJjZSwgc291cmNlTGVuZ3RoKSwgXCIvXCIpLmNvbmNhdChmbGFncyksICdyZWdleHAnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGFycmF5RnJvbVNldChzZXQpIHtcblx0ICB2YXIgdmFsdWVzID0gW107XG5cdCAgc2V0LmZvckVhY2goZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICB2YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdCAgfSk7XG5cdCAgcmV0dXJuIHZhbHVlcztcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RTZXQoc2V0LCBvcHRpb25zKSB7XG5cdCAgaWYgKHNldC5zaXplID09PSAwKSByZXR1cm4gJ1NldHt9Jztcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IDc7XG5cdCAgcmV0dXJuIFwiU2V0eyBcIi5jb25jYXQoaW5zcGVjdExpc3QoYXJyYXlGcm9tU2V0KHNldCksIG9wdGlvbnMpLCBcIiB9XCIpO1xuXHR9XG5cblx0dmFyIHN0cmluZ0VzY2FwZUNoYXJzID0gbmV3IFJlZ0V4cChcIlsnXFxcXHUwMDAwLVxcXFx1MDAxZlxcXFx1MDA3Zi1cXFxcdTAwOWZcXFxcdTAwYWRcXFxcdTA2MDAtXFxcXHUwNjA0XFxcXHUwNzBmXFxcXHUxN2I0XFxcXHUxN2I1XCIgKyBcIlxcXFx1MjAwYy1cXFxcdTIwMGZcXFxcdTIwMjgtXFxcXHUyMDJmXFxcXHUyMDYwLVxcXFx1MjA2ZlxcXFx1ZmVmZlxcXFx1ZmZmMC1cXFxcdWZmZmZdXCIsICdnJyk7XG5cdHZhciBlc2NhcGVDaGFyYWN0ZXJzID0ge1xuXHQgICdcXGInOiAnXFxcXGInLFxuXHQgICdcXHQnOiAnXFxcXHQnLFxuXHQgICdcXG4nOiAnXFxcXG4nLFxuXHQgICdcXGYnOiAnXFxcXGYnLFxuXHQgICdcXHInOiAnXFxcXHInLFxuXHQgIFwiJ1wiOiBcIlxcXFwnXCIsXG5cdCAgJ1xcXFwnOiAnXFxcXFxcXFwnXG5cdH07XG5cdHZhciBoZXggPSAxNjtcblx0dmFyIHVuaWNvZGVMZW5ndGggPSA0O1xuXG5cdGZ1bmN0aW9uIGVzY2FwZShjaGFyKSB7XG5cdCAgcmV0dXJuIGVzY2FwZUNoYXJhY3RlcnNbY2hhcl0gfHwgXCJcXFxcdVwiLmNvbmNhdChcIjAwMDBcIi5jb25jYXQoY2hhci5jaGFyQ29kZUF0KDApLnRvU3RyaW5nKGhleCkpLnNsaWNlKC11bmljb2RlTGVuZ3RoKSk7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnNwZWN0U3RyaW5nKHN0cmluZywgb3B0aW9ucykge1xuXHQgIGlmIChzdHJpbmdFc2NhcGVDaGFycy50ZXN0KHN0cmluZykpIHtcblx0ICAgIHN0cmluZyA9IHN0cmluZy5yZXBsYWNlKHN0cmluZ0VzY2FwZUNoYXJzLCBlc2NhcGUpO1xuXHQgIH1cblxuXHQgIHJldHVybiBvcHRpb25zLnN0eWxpemUoXCInXCIuY29uY2F0KHRydW5jYXRlKHN0cmluZywgb3B0aW9ucy50cnVuY2F0ZSAtIDIpLCBcIidcIiksICdzdHJpbmcnKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGluc3BlY3RTeW1ib2wodmFsdWUpIHtcblx0ICBpZiAoJ2Rlc2NyaXB0aW9uJyBpbiBTeW1ib2wucHJvdG90eXBlKSB7XG5cdCAgICByZXR1cm4gdmFsdWUuZGVzY3JpcHRpb24gPyBcIlN5bWJvbChcIi5jb25jYXQodmFsdWUuZGVzY3JpcHRpb24sIFwiKVwiKSA6ICdTeW1ib2woKSc7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG5cdH1cblxuXHR2YXIgZ2V0UHJvbWlzZVZhbHVlID0gZnVuY3Rpb24gZ2V0UHJvbWlzZVZhbHVlKCkge1xuXHQgIHJldHVybiAnUHJvbWlzZXvigKZ9Jztcblx0fTtcblxuXHQvLyB0cnkge1xuXHQvLyAgIHZhciBfcHJvY2VzcyRiaW5kaW5nID0gcHJvY2Vzcy5iaW5kaW5nKCd1dGlsJyksXG5cdC8vICAgICAgIGdldFByb21pc2VEZXRhaWxzID0gX3Byb2Nlc3MkYmluZGluZy5nZXRQcm9taXNlRGV0YWlscyxcblx0Ly8gICAgICAga1BlbmRpbmcgPSBfcHJvY2VzcyRiaW5kaW5nLmtQZW5kaW5nLFxuXHQvLyAgICAgICBrUmVqZWN0ZWQgPSBfcHJvY2VzcyRiaW5kaW5nLmtSZWplY3RlZDtcblxuXHQvLyAgIGdldFByb21pc2VWYWx1ZSA9IGZ1bmN0aW9uIGdldFByb21pc2VWYWx1ZSh2YWx1ZSwgb3B0aW9ucykge1xuXHQvLyAgICAgdmFyIF9nZXRQcm9taXNlRGV0YWlscyA9IGdldFByb21pc2VEZXRhaWxzKHZhbHVlKSxcblx0Ly8gICAgICAgICBfZ2V0UHJvbWlzZURldGFpbHMyID0gX3NsaWNlZFRvQXJyYXkoX2dldFByb21pc2VEZXRhaWxzLCAyKSxcblx0Ly8gICAgICAgICBzdGF0ZSA9IF9nZXRQcm9taXNlRGV0YWlsczJbMF0sXG5cdC8vICAgICAgICAgaW5uZXJWYWx1ZSA9IF9nZXRQcm9taXNlRGV0YWlsczJbMV07XG5cblx0Ly8gICAgIGlmIChzdGF0ZSA9PT0ga1BlbmRpbmcpIHtcblx0Ly8gICAgICAgcmV0dXJuICdQcm9taXNlezxwZW5kaW5nPn0nO1xuXHQvLyAgICAgfVxuXG5cdC8vICAgICByZXR1cm4gXCJQcm9taXNlXCIuY29uY2F0KHN0YXRlID09PSBrUmVqZWN0ZWQgPyAnIScgOiAnJywgXCJ7XCIpLmNvbmNhdChvcHRpb25zLmluc3BlY3QoaW5uZXJWYWx1ZSwgb3B0aW9ucyksIFwifVwiKTtcblx0Ly8gICB9O1xuXHQvLyB9IGNhdGNoIChub3ROb2RlKSB7XG5cdC8vICAgLyogaWdub3JlICovXG5cdC8vIH1cblxuXHR2YXIgaW5zcGVjdFByb21pc2UgPSBnZXRQcm9taXNlVmFsdWU7XG5cblx0ZnVuY3Rpb24gaW5zcGVjdE9iamVjdChvYmplY3QsIG9wdGlvbnMpIHtcblx0ICB2YXIgcHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG9iamVjdCk7XG5cdCAgdmFyIHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID8gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhvYmplY3QpIDogW107XG5cblx0ICBpZiAocHJvcGVydGllcy5sZW5ndGggPT09IDAgJiYgc3ltYm9scy5sZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAne30nO1xuXHQgIH1cblxuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gNDtcblx0ICB2YXIgcHJvcGVydHlDb250ZW50cyA9IGluc3BlY3RMaXN0KHByb3BlcnRpZXMubWFwKGZ1bmN0aW9uIChrZXkpIHtcblx0ICAgIHJldHVybiBba2V5LCBvYmplY3Rba2V5XV07XG5cdCAgfSksIG9wdGlvbnMsIGluc3BlY3RQcm9wZXJ0eSk7XG5cdCAgdmFyIHN5bWJvbENvbnRlbnRzID0gaW5zcGVjdExpc3Qoc3ltYm9scy5tYXAoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgcmV0dXJuIFtrZXksIG9iamVjdFtrZXldXTtcblx0ICB9KSwgb3B0aW9ucywgaW5zcGVjdFByb3BlcnR5KTtcblx0ICB2YXIgc2VwID0gJyc7XG5cblx0ICBpZiAocHJvcGVydHlDb250ZW50cyAmJiBzeW1ib2xDb250ZW50cykge1xuXHQgICAgc2VwID0gJywgJztcblx0ICB9XG5cblx0ICByZXR1cm4gXCJ7IFwiLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzKS5jb25jYXQoc2VwKS5jb25jYXQoc3ltYm9sQ29udGVudHMsIFwiIH1cIik7XG5cdH1cblxuXHR2YXIgdG9TdHJpbmdUYWcgPSB0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcgPyBTeW1ib2wudG9TdHJpbmdUYWcgOiBmYWxzZTtcblx0ZnVuY3Rpb24gaW5zcGVjdENsYXNzKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgdmFyIG5hbWUgPSAnJztcblxuXHQgIGlmICh0b1N0cmluZ1RhZyAmJiB0b1N0cmluZ1RhZyBpbiB2YWx1ZSkge1xuXHQgICAgbmFtZSA9IHZhbHVlW3RvU3RyaW5nVGFnXTtcblx0ICB9XG5cblx0ICBuYW1lID0gbmFtZSB8fCBnZXRGdW5jTmFtZV8xKHZhbHVlLmNvbnN0cnVjdG9yKTsgLy8gQmFiZWwgdHJhbnNmb3JtcyBhbm9ueW1vdXMgY2xhc3NlcyB0byB0aGUgbmFtZSBgX2NsYXNzYFxuXG5cdCAgaWYgKCFuYW1lIHx8IG5hbWUgPT09ICdfY2xhc3MnKSB7XG5cdCAgICBuYW1lID0gJzxBbm9ueW1vdXMgQ2xhc3M+Jztcblx0ICB9XG5cblx0ICBvcHRpb25zLnRydW5jYXRlIC09IG5hbWUubGVuZ3RoO1xuXHQgIHJldHVybiBcIlwiLmNvbmNhdChuYW1lKS5jb25jYXQoaW5zcGVjdE9iamVjdCh2YWx1ZSwgb3B0aW9ucykpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zcGVjdEFyZ3VtZW50cyhhcmdzLCBvcHRpb25zKSB7XG5cdCAgaWYgKGFyZ3MubGVuZ3RoID09PSAwKSByZXR1cm4gJ0FyZ3VtZW50c1tdJztcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IDEzO1xuXHQgIHJldHVybiBcIkFyZ3VtZW50c1sgXCIuY29uY2F0KGluc3BlY3RMaXN0KGFyZ3MsIG9wdGlvbnMpLCBcIiBdXCIpO1xuXHR9XG5cblx0dmFyIGVycm9yS2V5cyA9IFsnc3RhY2snLCAnbGluZScsICdjb2x1bW4nLCAnbmFtZScsICdtZXNzYWdlJywgJ2ZpbGVOYW1lJywgJ2xpbmVOdW1iZXInLCAnY29sdW1uTnVtYmVyJywgJ251bWJlcicsICdkZXNjcmlwdGlvbiddO1xuXHRmdW5jdGlvbiBpbnNwZWN0T2JqZWN0JDEoZXJyb3IsIG9wdGlvbnMpIHtcblx0ICB2YXIgcHJvcGVydGllcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVycm9yKS5maWx0ZXIoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgcmV0dXJuIGVycm9yS2V5cy5pbmRleE9mKGtleSkgPT09IC0xO1xuXHQgIH0pO1xuXHQgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IG5hbWUubGVuZ3RoO1xuXHQgIHZhciBtZXNzYWdlID0gJyc7XG5cblx0ICBpZiAodHlwZW9mIGVycm9yLm1lc3NhZ2UgPT09ICdzdHJpbmcnKSB7XG5cdCAgICBtZXNzYWdlID0gdHJ1bmNhdGUoZXJyb3IubWVzc2FnZSwgb3B0aW9ucy50cnVuY2F0ZSk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIHByb3BlcnRpZXMudW5zaGlmdCgnbWVzc2FnZScpO1xuXHQgIH1cblxuXHQgIG1lc3NhZ2UgPSBtZXNzYWdlID8gXCI6IFwiLmNvbmNhdChtZXNzYWdlKSA6ICcnO1xuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gbWVzc2FnZS5sZW5ndGggKyA1O1xuXHQgIHZhciBwcm9wZXJ0eUNvbnRlbnRzID0gaW5zcGVjdExpc3QocHJvcGVydGllcy5tYXAoZnVuY3Rpb24gKGtleSkge1xuXHQgICAgcmV0dXJuIFtrZXksIGVycm9yW2tleV1dO1xuXHQgIH0pLCBvcHRpb25zLCBpbnNwZWN0UHJvcGVydHkpO1xuXHQgIHJldHVybiBcIlwiLmNvbmNhdChuYW1lKS5jb25jYXQobWVzc2FnZSkuY29uY2F0KHByb3BlcnR5Q29udGVudHMgPyBcIiB7IFwiLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzLCBcIiB9XCIpIDogJycpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5zcGVjdEF0dHJpYnV0ZShfcmVmLCBvcHRpb25zKSB7XG5cdCAgdmFyIF9yZWYyID0gX3NsaWNlZFRvQXJyYXkoX3JlZiwgMiksXG5cdCAgICAgIGtleSA9IF9yZWYyWzBdLFxuXHQgICAgICB2YWx1ZSA9IF9yZWYyWzFdO1xuXG5cdCAgb3B0aW9ucy50cnVuY2F0ZSAtPSAzO1xuXG5cdCAgaWYgKCF2YWx1ZSkge1xuXHQgICAgcmV0dXJuIFwiXCIuY29uY2F0KG9wdGlvbnMuc3R5bGl6ZShrZXksICd5ZWxsb3cnKSk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KG9wdGlvbnMuc3R5bGl6ZShrZXksICd5ZWxsb3cnKSwgXCI9XCIpLmNvbmNhdChvcHRpb25zLnN0eWxpemUoXCJcXFwiXCIuY29uY2F0KHZhbHVlLCBcIlxcXCJcIiksICdzdHJpbmcnKSk7XG5cdH1cblx0ZnVuY3Rpb24gaW5zcGVjdEhUTUxDb2xsZWN0aW9uKGNvbGxlY3Rpb24sIG9wdGlvbnMpIHtcblx0ICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdXNlLWJlZm9yZS1kZWZpbmVcblx0ICByZXR1cm4gaW5zcGVjdExpc3QoY29sbGVjdGlvbiwgb3B0aW9ucywgaW5zcGVjdEhUTUwsICdcXG4nKTtcblx0fVxuXHRmdW5jdGlvbiBpbnNwZWN0SFRNTChlbGVtZW50LCBvcHRpb25zKSB7XG5cdCAgdmFyIHByb3BlcnRpZXMgPSBlbGVtZW50LmdldEF0dHJpYnV0ZU5hbWVzKCk7XG5cdCAgdmFyIG5hbWUgPSBlbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0ICB2YXIgaGVhZCA9IG9wdGlvbnMuc3R5bGl6ZShcIjxcIi5jb25jYXQobmFtZSksICdzcGVjaWFsJyk7XG5cdCAgdmFyIGhlYWRDbG9zZSA9IG9wdGlvbnMuc3R5bGl6ZShcIj5cIiwgJ3NwZWNpYWwnKTtcblx0ICB2YXIgdGFpbCA9IG9wdGlvbnMuc3R5bGl6ZShcIjwvXCIuY29uY2F0KG5hbWUsIFwiPlwiKSwgJ3NwZWNpYWwnKTtcblx0ICBvcHRpb25zLnRydW5jYXRlIC09IG5hbWUubGVuZ3RoICogMiArIDU7XG5cdCAgdmFyIHByb3BlcnR5Q29udGVudHMgPSAnJztcblxuXHQgIGlmIChwcm9wZXJ0aWVzLmxlbmd0aCA+IDApIHtcblx0ICAgIHByb3BlcnR5Q29udGVudHMgKz0gJyAnO1xuXHQgICAgcHJvcGVydHlDb250ZW50cyArPSBpbnNwZWN0TGlzdChwcm9wZXJ0aWVzLm1hcChmdW5jdGlvbiAoa2V5KSB7XG5cdCAgICAgIHJldHVybiBba2V5LCBlbGVtZW50LmdldEF0dHJpYnV0ZShrZXkpXTtcblx0ICAgIH0pLCBvcHRpb25zLCBpbnNwZWN0QXR0cmlidXRlLCAnICcpO1xuXHQgIH1cblxuXHQgIG9wdGlvbnMudHJ1bmNhdGUgLT0gcHJvcGVydHlDb250ZW50cy5sZW5ndGg7XG5cdCAgdmFyIHRydW5jYXRlID0gb3B0aW9ucy50cnVuY2F0ZTtcblx0ICB2YXIgY2hpbGRyZW4gPSBpbnNwZWN0SFRNTENvbGxlY3Rpb24oZWxlbWVudC5jaGlsZHJlbiwgb3B0aW9ucyk7XG5cblx0ICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW4ubGVuZ3RoID4gdHJ1bmNhdGUpIHtcblx0ICAgIGNoaWxkcmVuID0gXCJcIi5jb25jYXQodHJ1bmNhdG9yLCBcIihcIikuY29uY2F0KGVsZW1lbnQuY2hpbGRyZW4ubGVuZ3RoLCBcIilcIik7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIFwiXCIuY29uY2F0KGhlYWQpLmNvbmNhdChwcm9wZXJ0eUNvbnRlbnRzKS5jb25jYXQoaGVhZENsb3NlKS5jb25jYXQoY2hpbGRyZW4pLmNvbmNhdCh0YWlsKTtcblx0fVxuXG5cdC8qICFcblx0ICogbG91cGVcblx0ICogQ29weXJpZ2h0KGMpIDIwMTMgSmFrZSBMdWVyIDxqYWtlQGFsb2dpY2FscGFyYWRveC5jb20+XG5cdCAqIE1JVCBMaWNlbnNlZFxuXHQgKi9cblx0dmFyIHN5bWJvbHNTdXBwb3J0ZWQgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBTeW1ib2wuZm9yID09PSAnZnVuY3Rpb24nO1xuXHR2YXIgY2hhaUluc3BlY3QgPSBzeW1ib2xzU3VwcG9ydGVkID8gU3ltYm9sLmZvcignY2hhaS9pbnNwZWN0JykgOiAnQEBjaGFpL2luc3BlY3QnO1xuXHR2YXIgbm9kZUluc3BlY3QgPSBmYWxzZTtcblxuXHR0cnkge1xuXHQgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBnbG9iYWwtcmVxdWlyZVxuXHQgIG5vZGVJbnNwZWN0ID0gcmVxdWlyZSgndXRpbCcpLmluc3BlY3QuY3VzdG9tO1xuXHR9IGNhdGNoIChub05vZGVJbnNwZWN0KSB7XG5cdCAgbm9kZUluc3BlY3QgPSBmYWxzZTtcblx0fVxuXG5cdHZhciBjb25zdHJ1Y3Rvck1hcCA9IG5ldyBXZWFrTWFwKCk7XG5cdHZhciBzdHJpbmdUYWdNYXAgPSB7fTtcblx0dmFyIGJhc2VUeXBlc01hcCA9IHtcblx0ICB1bmRlZmluZWQ6IGZ1bmN0aW9uIHVuZGVmaW5lZCQxKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG5cdCAgfSxcblx0ICBudWxsOiBmdW5jdGlvbiBfbnVsbCh2YWx1ZSwgb3B0aW9ucykge1xuXHQgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZShudWxsLCAnbnVsbCcpO1xuXHQgIH0sXG5cdCAgYm9vbGVhbjogZnVuY3Rpb24gYm9vbGVhbih2YWx1ZSwgb3B0aW9ucykge1xuXHQgICAgcmV0dXJuIG9wdGlvbnMuc3R5bGl6ZSh2YWx1ZSwgJ2Jvb2xlYW4nKTtcblx0ICB9LFxuXHQgIEJvb2xlYW46IGZ1bmN0aW9uIEJvb2xlYW4odmFsdWUsIG9wdGlvbnMpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUodmFsdWUsICdib29sZWFuJyk7XG5cdCAgfSxcblx0ICBudW1iZXI6IGluc3BlY3ROdW1iZXIsXG5cdCAgTnVtYmVyOiBpbnNwZWN0TnVtYmVyLFxuXHQgIEJpZ0ludDogaW5zcGVjdE51bWJlcixcblx0ICBiaWdpbnQ6IGluc3BlY3ROdW1iZXIsXG5cdCAgc3RyaW5nOiBpbnNwZWN0U3RyaW5nLFxuXHQgIFN0cmluZzogaW5zcGVjdFN0cmluZyxcblx0ICBmdW5jdGlvbjogaW5zcGVjdEZ1bmN0aW9uLFxuXHQgIEZ1bmN0aW9uOiBpbnNwZWN0RnVuY3Rpb24sXG5cdCAgc3ltYm9sOiBpbnNwZWN0U3ltYm9sLFxuXHQgIC8vIEEgU3ltYm9sIHBvbHlmaWxsIHdpbGwgcmV0dXJuIGBTeW1ib2xgIG5vdCBgc3ltYm9sYCBmcm9tIHR5cGVkZXRlY3Rcblx0ICBTeW1ib2w6IGluc3BlY3RTeW1ib2wsXG5cdCAgQXJyYXk6IGluc3BlY3RBcnJheSxcblx0ICBEYXRlOiBpbnNwZWN0RGF0ZSxcblx0ICBNYXA6IGluc3BlY3RNYXAsXG5cdCAgU2V0OiBpbnNwZWN0U2V0LFxuXHQgIFJlZ0V4cDogaW5zcGVjdFJlZ0V4cCxcblx0ICBQcm9taXNlOiBpbnNwZWN0UHJvbWlzZSxcblx0ICAvLyBXZWFrU2V0LCBXZWFrTWFwIGFyZSB0b3RhbGx5IG9wYXF1ZSB0byB1c1xuXHQgIFdlYWtTZXQ6IGZ1bmN0aW9uIFdlYWtTZXQodmFsdWUsIG9wdGlvbnMpIHtcblx0ICAgIHJldHVybiBvcHRpb25zLnN0eWxpemUoJ1dlYWtTZXR74oCmfScsICdzcGVjaWFsJyk7XG5cdCAgfSxcblx0ICBXZWFrTWFwOiBmdW5jdGlvbiBXZWFrTWFwKHZhbHVlLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKCdXZWFrTWFwe+KApn0nLCAnc3BlY2lhbCcpO1xuXHQgIH0sXG5cdCAgQXJndW1lbnRzOiBpbnNwZWN0QXJndW1lbnRzLFxuXHQgIEludDhBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgVWludDhBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgVWludDhDbGFtcGVkQXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIEludDE2QXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIFVpbnQxNkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBJbnQzMkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBVaW50MzJBcnJheTogaW5zcGVjdFR5cGVkQXJyYXksXG5cdCAgRmxvYXQzMkFycmF5OiBpbnNwZWN0VHlwZWRBcnJheSxcblx0ICBGbG9hdDY0QXJyYXk6IGluc3BlY3RUeXBlZEFycmF5LFxuXHQgIEdlbmVyYXRvcjogZnVuY3Rpb24gR2VuZXJhdG9yKCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgRGF0YVZpZXc6IGZ1bmN0aW9uIERhdGFWaWV3KCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgQXJyYXlCdWZmZXI6IGZ1bmN0aW9uIEFycmF5QnVmZmVyKCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH0sXG5cdCAgRXJyb3I6IGluc3BlY3RPYmplY3QkMSxcblx0ICBIVE1MQ29sbGVjdGlvbjogaW5zcGVjdEhUTUxDb2xsZWN0aW9uLFxuXHQgIE5vZGVMaXN0OiBpbnNwZWN0SFRNTENvbGxlY3Rpb25cblx0fTsgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcblxuXHR2YXIgaW5zcGVjdEN1c3RvbSA9IGZ1bmN0aW9uIGluc3BlY3RDdXN0b20odmFsdWUsIG9wdGlvbnMsIHR5cGUpIHtcblx0ICBpZiAoY2hhaUluc3BlY3QgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlW2NoYWlJbnNwZWN0XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcmV0dXJuIHZhbHVlW2NoYWlJbnNwZWN0XShvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAobm9kZUluc3BlY3QgJiYgbm9kZUluc3BlY3QgaW4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlW25vZGVJbnNwZWN0XSA9PT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgcmV0dXJuIHZhbHVlW25vZGVJbnNwZWN0XShvcHRpb25zLmRlcHRoLCBvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAoJ2luc3BlY3QnIGluIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5pbnNwZWN0ID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICByZXR1cm4gdmFsdWUuaW5zcGVjdChvcHRpb25zLmRlcHRoLCBvcHRpb25zKTtcblx0ICB9XG5cblx0ICBpZiAoJ2NvbnN0cnVjdG9yJyBpbiB2YWx1ZSAmJiBjb25zdHJ1Y3Rvck1hcC5oYXModmFsdWUuY29uc3RydWN0b3IpKSB7XG5cdCAgICByZXR1cm4gY29uc3RydWN0b3JNYXAuZ2V0KHZhbHVlLmNvbnN0cnVjdG9yKSh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfVxuXG5cdCAgaWYgKHN0cmluZ1RhZ01hcFt0eXBlXSkge1xuXHQgICAgcmV0dXJuIHN0cmluZ1RhZ01hcFt0eXBlXSh2YWx1ZSwgb3B0aW9ucyk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuICcnO1xuXHR9OyAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuXG5cblx0ZnVuY3Rpb24gaW5zcGVjdCh2YWx1ZSwgb3B0aW9ucykge1xuXHQgIG9wdGlvbnMgPSBub3JtYWxpc2VPcHRpb25zKG9wdGlvbnMpO1xuXHQgIG9wdGlvbnMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cdCAgdmFyIF9vcHRpb25zID0gb3B0aW9ucyxcblx0ICAgICAgY3VzdG9tSW5zcGVjdCA9IF9vcHRpb25zLmN1c3RvbUluc3BlY3Q7XG5cdCAgdmFyIHR5cGUgPSB0eXBlRGV0ZWN0KHZhbHVlKTsgLy8gSWYgaXQgaXMgYSBiYXNlIHZhbHVlIHRoYXQgd2UgYWxyZWFkeSBzdXBwb3J0LCB0aGVuIHVzZSBMb3VwZSdzIGluc3BlY3RvclxuXHQgIGlmIChiYXNlVHlwZXNNYXBbdHlwZV0pIHtcblx0ICAgIHJldHVybiBiYXNlVHlwZXNNYXBbdHlwZV0odmFsdWUsIG9wdGlvbnMpO1xuXHQgIH0gLy8gSWYgYG9wdGlvbnMuY3VzdG9tSW5zcGVjdGAgaXMgc2V0IHRvIHRydWUgdGhlbiB0cnkgdG8gdXNlIHRoZSBjdXN0b20gaW5zcGVjdG9yXG5cblxuXHQgIGlmIChjdXN0b21JbnNwZWN0ICYmIHZhbHVlKSB7XG5cdCAgICB2YXIgb3V0cHV0ID0gaW5zcGVjdEN1c3RvbSh2YWx1ZSwgb3B0aW9ucywgdHlwZSk7XG5cdCAgICBpZiAob3V0cHV0KSByZXR1cm4gaW5zcGVjdChvdXRwdXQsIG9wdGlvbnMpO1xuXHQgIH1cblxuXHQgIHZhciBwcm90byA9IHZhbHVlID8gT2JqZWN0LmdldFByb3RvdHlwZU9mKHZhbHVlKSA6IGZhbHNlOyAvLyBJZiBpdCdzIGEgcGxhaW4gT2JqZWN0IHRoZW4gdXNlIExvdXBlJ3MgaW5zcGVjdG9yXG5cblx0ICBpZiAocHJvdG8gPT09IE9iamVjdC5wcm90b3R5cGUgfHwgcHJvdG8gPT09IG51bGwpIHtcblx0ICAgIHJldHVybiBpbnNwZWN0T2JqZWN0KHZhbHVlLCBvcHRpb25zKTtcblx0ICB9IC8vIFNwZWNpZmljYWxseSBhY2NvdW50IGZvciBIVE1MRWxlbWVudHNcblx0ICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcblxuXG5cdCAgaWYgKHZhbHVlICYmIHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ2Z1bmN0aW9uJyAmJiB2YWx1ZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSB7XG5cdCAgICByZXR1cm4gaW5zcGVjdEhUTUwodmFsdWUsIG9wdGlvbnMpO1xuXHQgIH0gLy8gSWYgaXQgaXMgYSBjbGFzcywgaW5zcGVjdCBpdCBsaWtlIGFuIG9iamVjdCBidXQgYWRkIHRoZSBjb25zdHJ1Y3RvciBuYW1lXG5cblxuXHQgIGlmICgnY29uc3RydWN0b3InIGluIHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yICE9PSBPYmplY3QpIHtcblx0ICAgIHJldHVybiBpbnNwZWN0Q2xhc3ModmFsdWUsIG9wdGlvbnMpO1xuXHQgIH0gLy8gV2UgaGF2ZSBydW4gb3V0IG9mIG9wdGlvbnMhIEp1c3Qgc3RyaW5naWZ5IHRoZSB2YWx1ZVxuXG5cblx0ICByZXR1cm4gb3B0aW9ucy5zdHlsaXplKFN0cmluZyh2YWx1ZSksIHR5cGUpO1xuXHR9XG5cdGZ1bmN0aW9uIHJlZ2lzdGVyQ29uc3RydWN0b3IoY29uc3RydWN0b3IsIGluc3BlY3Rvcikge1xuXHQgIGlmIChjb25zdHJ1Y3Rvck1hcC5oYXMoY29uc3RydWN0b3IpKSB7XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgfVxuXG5cdCAgY29uc3RydWN0b3JNYXAuYWRkKGNvbnN0cnVjdG9yLCBpbnNwZWN0b3IpO1xuXHQgIHJldHVybiB0cnVlO1xuXHR9XG5cdGZ1bmN0aW9uIHJlZ2lzdGVyU3RyaW5nVGFnKHN0cmluZ1RhZywgaW5zcGVjdG9yKSB7XG5cdCAgaWYgKHN0cmluZ1RhZyBpbiBzdHJpbmdUYWdNYXApIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cblx0ICBzdHJpbmdUYWdNYXBbc3RyaW5nVGFnXSA9IGluc3BlY3Rvcjtcblx0ICByZXR1cm4gdHJ1ZTtcblx0fVxuXHR2YXIgY3VzdG9tID0gY2hhaUluc3BlY3Q7XG5cblx0ZXhwb3J0cy5jdXN0b20gPSBjdXN0b207XG5cdGV4cG9ydHMuZGVmYXVsdCA9IGluc3BlY3Q7XG5cdGV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cdGV4cG9ydHMucmVnaXN0ZXJDb25zdHJ1Y3RvciA9IHJlZ2lzdGVyQ29uc3RydWN0b3I7XG5cdGV4cG9ydHMucmVnaXN0ZXJTdHJpbmdUYWcgPSByZWdpc3RlclN0cmluZ1RhZztcblxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBqc190eXBlX29mLCBycHIsIHNhZDtcblxuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gIHRoaXMuc2FkID0gc2FkID0gU3ltYm9sKCdzYWQnKTtcblxuICAoe3JwciwganNfdHlwZV9vZn0gPSByZXF1aXJlKCcuL2hlbHBlcnMnKSk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLmlzX3NhZCA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gKHggPT09IHNhZCkgfHwgKHggaW5zdGFuY2VvZiBFcnJvcikgfHwgKHRoaXMuaXNfc2FkZGVuZWQoeCkpO1xuICB9O1xuXG4gIHRoaXMuaXNfaGFwcHkgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuICF0aGlzLmlzX3NhZCh4KTtcbiAgfTtcblxuICB0aGlzLnNhZGRlbiA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgW3NhZF06IHRydWUsXG4gICAgICBfOiB4XG4gICAgfTtcbiAgfTtcblxuICB0aGlzLmlzX3NhZGRlbmVkID0gZnVuY3Rpb24oeCkge1xuICAgIHJldHVybiAoKGpzX3R5cGVfb2YoeCkpID09PSAnb2JqZWN0JykgJiYgKHhbc2FkXSA9PT0gdHJ1ZSk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLnVuc2FkZGVuID0gZnVuY3Rpb24oeCkge1xuICAgIGlmICh0aGlzLmlzX2hhcHB5KHgpKSB7XG4gICAgICByZXR1cm4geDtcbiAgICB9XG4gICAgdGhpcy52YWxpZGF0ZS5zYWRkZW5lZCh4KTtcbiAgICByZXR1cm4geC5fO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5kZWNsYXJlX2NoZWNrID0gZnVuY3Rpb24obmFtZSwgY2hlY2tlcikge1xuICAgIHRoaXMudmFsaWRhdGUubm9uZW1wdHlfdGV4dChuYW1lKTtcbiAgICB0aGlzLnZhbGlkYXRlLmZ1bmN0aW9uKGNoZWNrZXIpO1xuICAgIGlmICh0aGlzLnNwZWNzW25hbWVdICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgwrU4MDMyIHR5cGUgJHtycHIobmFtZSl9IGFscmVhZHkgZGVjbGFyZWRgKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuY2hlY2tzW25hbWVdICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgwrU4MDMzIGNoZWNrICR7cnByKG5hbWUpfSBhbHJlYWR5IGRlY2xhcmVkYCk7XG4gICAgfVxuICAgIHRoaXMuY2hlY2tzW25hbWVdID0gY2hlY2tlcjtcbiAgICByZXR1cm4gbnVsbDtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2hlY2tzLmpzLm1hcCIsIihmdW5jdGlvbigpIHtcbiAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAvLyB7IGVxdWFscywgfSAgICAgICAgICAgICAgID0gcmVxdWlyZSAnY25kJ1xuICB2YXIgQ0hFQ0tTLCBhc3NpZ24sIGpyLCBqc190eXBlX29mLCBqc2lkZW50aWZpZXJfcGF0dGVybiwgeHJwcixcbiAgICBtb2R1bG8gPSBmdW5jdGlvbihhLCBiKSB7IHJldHVybiAoK2EgJSAoYiA9ICtiKSArIGIpICUgYjsgfTtcblxuICAoe2Fzc2lnbiwganIsIHhycHIsIGpzX3R5cGVfb2Z9ID0gcmVxdWlyZSgnLi9oZWxwZXJzJykpO1xuXG4gIENIRUNLUyA9IHJlcXVpcmUoJy4vY2hlY2tzJyk7XG5cbiAgLyogdGh4IHRvXG4gICAgaHR0cHM6Ly9naXRodWIuY29tL21hdGhpYXNieW5lbnMvbW90aGVyZWZmLmluL2Jsb2IvbWFzdGVyL2pzLXZhcmlhYmxlcy9lZmYuanNcbiAgICBodHRwczovL21hdGhpYXNieW5lbnMuYmUvbm90ZXMvamF2YXNjcmlwdC1pZGVudGlmaWVycy1lczZcbiAgKi9cbiAgLy8ganNpZGVudGlmaWVyX3BhdHRlcm4gICAgICA9IC9eKD86W1xcJEEtWl9hLXpcXHhBQVxceEI1XFx4QkFcXHhDMC1cXHhENlxceEQ4LVxceEY2XFx4RjgtXFx1MDJDMVxcdTAyQzYtXFx1MDJEMVxcdTAyRTAtXFx1MDJFNFxcdTAyRUNcXHUwMkVFXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdBLVxcdTAzN0RcXHUwMzdGXFx1MDM4NlxcdTAzODgtXFx1MDM4QVxcdTAzOENcXHUwMzhFLVxcdTAzQTFcXHUwM0EzLVxcdTAzRjVcXHUwM0Y3LVxcdTA0ODFcXHUwNDhBLVxcdTA1MkZcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVEMC1cXHUwNUVBXFx1MDVGMC1cXHUwNUYyXFx1MDYyMC1cXHUwNjRBXFx1MDY2RVxcdTA2NkZcXHUwNjcxLVxcdTA2RDNcXHUwNkQ1XFx1MDZFNVxcdTA2RTZcXHUwNkVFXFx1MDZFRlxcdTA2RkEtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwXFx1MDcxMi1cXHUwNzJGXFx1MDc0RC1cXHUwN0E1XFx1MDdCMVxcdTA3Q0EtXFx1MDdFQVxcdTA3RjRcXHUwN0Y1XFx1MDdGQVxcdTA4MDAtXFx1MDgxNVxcdTA4MUFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4QTAtXFx1MDhCNFxcdTA5MDQtXFx1MDkzOVxcdTA5M0RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTgwXFx1MDk4NS1cXHUwOThDXFx1MDk4RlxcdTA5OTBcXHUwOTkzLVxcdTA5QThcXHUwOUFBLVxcdTA5QjBcXHUwOUIyXFx1MDlCNi1cXHUwOUI5XFx1MDlCRFxcdTA5Q0VcXHUwOURDXFx1MDlERFxcdTA5REYtXFx1MDlFMVxcdTA5RjBcXHUwOUYxXFx1MEEwNS1cXHUwQTBBXFx1MEEwRlxcdTBBMTBcXHUwQTEzLVxcdTBBMjhcXHUwQTJBLVxcdTBBMzBcXHUwQTMyXFx1MEEzM1xcdTBBMzVcXHUwQTM2XFx1MEEzOFxcdTBBMzlcXHUwQTU5LVxcdTBBNUNcXHUwQTVFXFx1MEE3Mi1cXHUwQTc0XFx1MEE4NS1cXHUwQThEXFx1MEE4Ri1cXHUwQTkxXFx1MEE5My1cXHUwQUE4XFx1MEFBQS1cXHUwQUIwXFx1MEFCMlxcdTBBQjNcXHUwQUI1LVxcdTBBQjlcXHUwQUJEXFx1MEFEMFxcdTBBRTBcXHUwQUUxXFx1MEFGOVxcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNEXFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjFcXHUwQjcxXFx1MEI4M1xcdTBCODUtXFx1MEI4QVxcdTBCOEUtXFx1MEI5MFxcdTBCOTItXFx1MEI5NVxcdTBCOTlcXHUwQjlBXFx1MEI5Q1xcdTBCOUVcXHUwQjlGXFx1MEJBM1xcdTBCQTRcXHUwQkE4LVxcdTBCQUFcXHUwQkFFLVxcdTBCQjlcXHUwQkQwXFx1MEMwNS1cXHUwQzBDXFx1MEMwRS1cXHUwQzEwXFx1MEMxMi1cXHUwQzI4XFx1MEMyQS1cXHUwQzM5XFx1MEMzRFxcdTBDNTgtXFx1MEM1QVxcdTBDNjBcXHUwQzYxXFx1MEM4NS1cXHUwQzhDXFx1MEM4RS1cXHUwQzkwXFx1MEM5Mi1cXHUwQ0E4XFx1MENBQS1cXHUwQ0IzXFx1MENCNS1cXHUwQ0I5XFx1MENCRFxcdTBDREVcXHUwQ0UwXFx1MENFMVxcdTBDRjFcXHUwQ0YyXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRFxcdTBENEVcXHUwRDVGLVxcdTBENjFcXHUwRDdBLVxcdTBEN0ZcXHUwRDg1LVxcdTBEOTZcXHUwRDlBLVxcdTBEQjFcXHUwREIzLVxcdTBEQkJcXHUwREJEXFx1MERDMC1cXHUwREM2XFx1MEUwMS1cXHUwRTMwXFx1MEUzMlxcdTBFMzNcXHUwRTQwLVxcdTBFNDZcXHUwRTgxXFx1MEU4MlxcdTBFODRcXHUwRTg3XFx1MEU4OFxcdTBFOEFcXHUwRThEXFx1MEU5NC1cXHUwRTk3XFx1MEU5OS1cXHUwRTlGXFx1MEVBMS1cXHUwRUEzXFx1MEVBNVxcdTBFQTdcXHUwRUFBXFx1MEVBQlxcdTBFQUQtXFx1MEVCMFxcdTBFQjJcXHUwRUIzXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEY0MC1cXHUwRjQ3XFx1MEY0OS1cXHUwRjZDXFx1MEY4OC1cXHUwRjhDXFx1MTAwMC1cXHUxMDJBXFx1MTAzRlxcdTEwNTAtXFx1MTA1NVxcdTEwNUEtXFx1MTA1RFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNkUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOEVcXHUxMEEwLVxcdTEwQzVcXHUxMEM3XFx1MTBDRFxcdTEwRDAtXFx1MTBGQVxcdTEwRkMtXFx1MTI0OFxcdTEyNEEtXFx1MTI0RFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVBLVxcdTEyNURcXHUxMjYwLVxcdTEyODhcXHUxMjhBLVxcdTEyOERcXHUxMjkwLVxcdTEyQjBcXHUxMkIyLVxcdTEyQjVcXHUxMkI4LVxcdTEyQkVcXHUxMkMwXFx1MTJDMi1cXHUxMkM1XFx1MTJDOC1cXHUxMkQ2XFx1MTJEOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVBXFx1MTM4MC1cXHUxMzhGXFx1MTNBMC1cXHUxM0Y1XFx1MTNGOC1cXHUxM0ZEXFx1MTQwMS1cXHUxNjZDXFx1MTY2Ri1cXHUxNjdGXFx1MTY4MS1cXHUxNjlBXFx1MTZBMC1cXHUxNkVBXFx1MTZFRS1cXHUxNkY4XFx1MTcwMC1cXHUxNzBDXFx1MTcwRS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZDXFx1MTc2RS1cXHUxNzcwXFx1MTc4MC1cXHUxN0IzXFx1MTdEN1xcdTE3RENcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4QThcXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFFXFx1MTk1MC1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlCMC1cXHUxOUM5XFx1MUEwMC1cXHUxQTE2XFx1MUEyMC1cXHUxQTU0XFx1MUFBN1xcdTFCMDUtXFx1MUIzM1xcdTFCNDUtXFx1MUI0QlxcdTFCODMtXFx1MUJBMFxcdTFCQUVcXHUxQkFGXFx1MUJCQS1cXHUxQkU1XFx1MUMwMC1cXHUxQzIzXFx1MUM0RC1cXHUxQzRGXFx1MUM1QS1cXHUxQzdEXFx1MUNFOS1cXHUxQ0VDXFx1MUNFRS1cXHUxQ0YxXFx1MUNGNVxcdTFDRjZcXHUxRDAwLVxcdTFEQkZcXHUxRTAwLVxcdTFGMTVcXHUxRjE4LVxcdTFGMURcXHUxRjIwLVxcdTFGNDVcXHUxRjQ4LVxcdTFGNERcXHUxRjUwLVxcdTFGNTdcXHUxRjU5XFx1MUY1QlxcdTFGNURcXHUxRjVGLVxcdTFGN0RcXHUxRjgwLVxcdTFGQjRcXHUxRkI2LVxcdTFGQkNcXHUxRkJFXFx1MUZDMi1cXHUxRkM0XFx1MUZDNi1cXHUxRkNDXFx1MUZEMC1cXHUxRkQzXFx1MUZENi1cXHUxRkRCXFx1MUZFMC1cXHUxRkVDXFx1MUZGMi1cXHUxRkY0XFx1MUZGNi1cXHUxRkZDXFx1MjA3MVxcdTIwN0ZcXHUyMDkwLVxcdTIwOUNcXHUyMTAyXFx1MjEwN1xcdTIxMEEtXFx1MjExM1xcdTIxMTVcXHUyMTE4LVxcdTIxMURcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJBLVxcdTIxMzlcXHUyMTNDLVxcdTIxM0ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRFXFx1MjE2MC1cXHUyMTg4XFx1MkMwMC1cXHUyQzJFXFx1MkMzMC1cXHUyQzVFXFx1MkM2MC1cXHUyQ0U0XFx1MkNFQi1cXHUyQ0VFXFx1MkNGMlxcdTJDRjNcXHUyRDAwLVxcdTJEMjVcXHUyRDI3XFx1MkQyRFxcdTJEMzAtXFx1MkQ2N1xcdTJENkZcXHUyRDgwLVxcdTJEOTZcXHUyREEwLVxcdTJEQTZcXHUyREE4LVxcdTJEQUVcXHUyREIwLVxcdTJEQjZcXHUyREI4LVxcdTJEQkVcXHUyREMwLVxcdTJEQzZcXHUyREM4LVxcdTJEQ0VcXHUyREQwLVxcdTJERDZcXHUyREQ4LVxcdTJEREVcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM0NcXHUzMDQxLVxcdTMwOTZcXHUzMDlCLVxcdTMwOUZcXHUzMEExLVxcdTMwRkFcXHUzMEZDLVxcdTMwRkZcXHUzMTA1LVxcdTMxMkRcXHUzMTMxLVxcdTMxOEVcXHUzMUEwLVxcdTMxQkFcXHUzMUYwLVxcdTMxRkZcXHUzNDAwLVxcdTREQjVcXHU0RTAwLVxcdTlGRDVcXHVBMDAwLVxcdUE0OENcXHVBNEQwLVxcdUE0RkRcXHVBNTAwLVxcdUE2MENcXHVBNjEwLVxcdUE2MUZcXHVBNjJBXFx1QTYyQlxcdUE2NDAtXFx1QTY2RVxcdUE2N0YtXFx1QTY5RFxcdUE2QTAtXFx1QTZFRlxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTdBRFxcdUE3QjAtXFx1QTdCN1xcdUE3RjctXFx1QTgwMVxcdUE4MDMtXFx1QTgwNVxcdUE4MDctXFx1QTgwQVxcdUE4MEMtXFx1QTgyMlxcdUE4NDAtXFx1QTg3M1xcdUE4ODItXFx1QThCM1xcdUE4RjItXFx1QThGN1xcdUE4RkJcXHVBOEZEXFx1QTkwQS1cXHVBOTI1XFx1QTkzMC1cXHVBOTQ2XFx1QTk2MC1cXHVBOTdDXFx1QTk4NC1cXHVBOUIyXFx1QTlDRlxcdUE5RTAtXFx1QTlFNFxcdUE5RTYtXFx1QTlFRlxcdUE5RkEtXFx1QTlGRVxcdUFBMDAtXFx1QUEyOFxcdUFBNDAtXFx1QUE0MlxcdUFBNDQtXFx1QUE0QlxcdUFBNjAtXFx1QUE3NlxcdUFBN0FcXHVBQTdFLVxcdUFBQUZcXHVBQUIxXFx1QUFCNVxcdUFBQjZcXHVBQUI5LVxcdUFBQkRcXHVBQUMwXFx1QUFDMlxcdUFBREItXFx1QUFERFxcdUFBRTAtXFx1QUFFQVxcdUFBRjItXFx1QUFGNFxcdUFCMDEtXFx1QUIwNlxcdUFCMDktXFx1QUIwRVxcdUFCMTEtXFx1QUIxNlxcdUFCMjAtXFx1QUIyNlxcdUFCMjgtXFx1QUIyRVxcdUFCMzAtXFx1QUI1QVxcdUFCNUMtXFx1QUI2NVxcdUFCNzAtXFx1QUJFMlxcdUFDMDAtXFx1RDdBM1xcdUQ3QjAtXFx1RDdDNlxcdUQ3Q0ItXFx1RDdGQlxcdUY5MDAtXFx1RkE2RFxcdUZBNzAtXFx1RkFEOVxcdUZCMDAtXFx1RkIwNlxcdUZCMTMtXFx1RkIxN1xcdUZCMURcXHVGQjFGLVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFNzAtXFx1RkU3NFxcdUZFNzYtXFx1RkVGQ1xcdUZGMjEtXFx1RkYzQVxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ118XFx1RDgwMFtcXHVEQzAwLVxcdURDMEJcXHVEQzBELVxcdURDMjZcXHVEQzI4LVxcdURDM0FcXHVEQzNDXFx1REMzRFxcdURDM0YtXFx1REM0RFxcdURDNTAtXFx1REM1RFxcdURDODAtXFx1RENGQVxcdURENDAtXFx1REQ3NFxcdURFODAtXFx1REU5Q1xcdURFQTAtXFx1REVEMFxcdURGMDAtXFx1REYxRlxcdURGMzAtXFx1REY0QVxcdURGNTAtXFx1REY3NVxcdURGODAtXFx1REY5RFxcdURGQTAtXFx1REZDM1xcdURGQzgtXFx1REZDRlxcdURGRDEtXFx1REZENV18XFx1RDgwMVtcXHVEQzAwLVxcdURDOURcXHVERDAwLVxcdUREMjdcXHVERDMwLVxcdURENjNcXHVERTAwLVxcdURGMzZcXHVERjQwLVxcdURGNTVcXHVERjYwLVxcdURGNjddfFxcdUQ4MDJbXFx1REMwMC1cXHVEQzA1XFx1REMwOFxcdURDMEEtXFx1REMzNVxcdURDMzdcXHVEQzM4XFx1REMzQ1xcdURDM0YtXFx1REM1NVxcdURDNjAtXFx1REM3NlxcdURDODAtXFx1REM5RVxcdURDRTAtXFx1RENGMlxcdURDRjRcXHVEQ0Y1XFx1REQwMC1cXHVERDE1XFx1REQyMC1cXHVERDM5XFx1REQ4MC1cXHVEREI3XFx1RERCRVxcdUREQkZcXHVERTAwXFx1REUxMC1cXHVERTEzXFx1REUxNS1cXHVERTE3XFx1REUxOS1cXHVERTMzXFx1REU2MC1cXHVERTdDXFx1REU4MC1cXHVERTlDXFx1REVDMC1cXHVERUM3XFx1REVDOS1cXHVERUU0XFx1REYwMC1cXHVERjM1XFx1REY0MC1cXHVERjU1XFx1REY2MC1cXHVERjcyXFx1REY4MC1cXHVERjkxXXxcXHVEODAzW1xcdURDMDAtXFx1REM0OFxcdURDODAtXFx1RENCMlxcdURDQzAtXFx1RENGMl18XFx1RDgwNFtcXHVEQzAzLVxcdURDMzdcXHVEQzgzLVxcdURDQUZcXHVEQ0QwLVxcdURDRThcXHVERDAzLVxcdUREMjZcXHVERDUwLVxcdURENzJcXHVERDc2XFx1REQ4My1cXHVEREIyXFx1RERDMS1cXHVEREM0XFx1REREQVxcdURERENcXHVERTAwLVxcdURFMTFcXHVERTEzLVxcdURFMkJcXHVERTgwLVxcdURFODZcXHVERTg4XFx1REU4QS1cXHVERThEXFx1REU4Ri1cXHVERTlEXFx1REU5Ri1cXHVERUE4XFx1REVCMC1cXHVERURFXFx1REYwNS1cXHVERjBDXFx1REYwRlxcdURGMTBcXHVERjEzLVxcdURGMjhcXHVERjJBLVxcdURGMzBcXHVERjMyXFx1REYzM1xcdURGMzUtXFx1REYzOVxcdURGM0RcXHVERjUwXFx1REY1RC1cXHVERjYxXXxcXHVEODA1W1xcdURDODAtXFx1RENBRlxcdURDQzRcXHVEQ0M1XFx1RENDN1xcdUREODAtXFx1RERBRVxcdURERDgtXFx1REREQlxcdURFMDAtXFx1REUyRlxcdURFNDRcXHVERTgwLVxcdURFQUFcXHVERjAwLVxcdURGMTldfFxcdUQ4MDZbXFx1RENBMC1cXHVEQ0RGXFx1RENGRlxcdURFQzAtXFx1REVGOF18XFx1RDgwOFtcXHVEQzAwLVxcdURGOTldfFxcdUQ4MDlbXFx1REMwMC1cXHVEQzZFXFx1REM4MC1cXHVERDQzXXxbXFx1RDgwQ1xcdUQ4NDAtXFx1RDg2OFxcdUQ4NkEtXFx1RDg2Q1xcdUQ4NkYtXFx1RDg3Ml1bXFx1REMwMC1cXHVERkZGXXxcXHVEODBEW1xcdURDMDAtXFx1REMyRV18XFx1RDgxMVtcXHVEQzAwLVxcdURFNDZdfFxcdUQ4MUFbXFx1REMwMC1cXHVERTM4XFx1REU0MC1cXHVERTVFXFx1REVEMC1cXHVERUVEXFx1REYwMC1cXHVERjJGXFx1REY0MC1cXHVERjQzXFx1REY2My1cXHVERjc3XFx1REY3RC1cXHVERjhGXXxcXHVEODFCW1xcdURGMDAtXFx1REY0NFxcdURGNTBcXHVERjkzLVxcdURGOUZdfFxcdUQ4MkNbXFx1REMwMFxcdURDMDFdfFxcdUQ4MkZbXFx1REMwMC1cXHVEQzZBXFx1REM3MC1cXHVEQzdDXFx1REM4MC1cXHVEQzg4XFx1REM5MC1cXHVEQzk5XXxcXHVEODM1W1xcdURDMDAtXFx1REM1NFxcdURDNTYtXFx1REM5Q1xcdURDOUVcXHVEQzlGXFx1RENBMlxcdURDQTVcXHVEQ0E2XFx1RENBOS1cXHVEQ0FDXFx1RENBRS1cXHVEQ0I5XFx1RENCQlxcdURDQkQtXFx1RENDM1xcdURDQzUtXFx1REQwNVxcdUREMDctXFx1REQwQVxcdUREMEQtXFx1REQxNFxcdUREMTYtXFx1REQxQ1xcdUREMUUtXFx1REQzOVxcdUREM0ItXFx1REQzRVxcdURENDAtXFx1REQ0NFxcdURENDZcXHVERDRBLVxcdURENTBcXHVERDUyLVxcdURFQTVcXHVERUE4LVxcdURFQzBcXHVERUMyLVxcdURFREFcXHVERURDLVxcdURFRkFcXHVERUZDLVxcdURGMTRcXHVERjE2LVxcdURGMzRcXHVERjM2LVxcdURGNEVcXHVERjUwLVxcdURGNkVcXHVERjcwLVxcdURGODhcXHVERjhBLVxcdURGQThcXHVERkFBLVxcdURGQzJcXHVERkM0LVxcdURGQ0JdfFxcdUQ4M0FbXFx1REMwMC1cXHVEQ0M0XXxcXHVEODNCW1xcdURFMDAtXFx1REUwM1xcdURFMDUtXFx1REUxRlxcdURFMjFcXHVERTIyXFx1REUyNFxcdURFMjdcXHVERTI5LVxcdURFMzJcXHVERTM0LVxcdURFMzdcXHVERTM5XFx1REUzQlxcdURFNDJcXHVERTQ3XFx1REU0OVxcdURFNEJcXHVERTRELVxcdURFNEZcXHVERTUxXFx1REU1MlxcdURFNTRcXHVERTU3XFx1REU1OVxcdURFNUJcXHVERTVEXFx1REU1RlxcdURFNjFcXHVERTYyXFx1REU2NFxcdURFNjctXFx1REU2QVxcdURFNkMtXFx1REU3MlxcdURFNzQtXFx1REU3N1xcdURFNzktXFx1REU3Q1xcdURFN0VcXHVERTgwLVxcdURFODlcXHVERThCLVxcdURFOUJcXHVERUExLVxcdURFQTNcXHVERUE1LVxcdURFQTlcXHVERUFCLVxcdURFQkJdfFxcdUQ4NjlbXFx1REMwMC1cXHVERUQ2XFx1REYwMC1cXHVERkZGXXxcXHVEODZEW1xcdURDMDAtXFx1REYzNFxcdURGNDAtXFx1REZGRl18XFx1RDg2RVtcXHVEQzAwLVxcdURDMURcXHVEQzIwLVxcdURGRkZdfFxcdUQ4NzNbXFx1REMwMC1cXHVERUExXXxcXHVEODdFW1xcdURDMDAtXFx1REUxRF0pKD86W1xcJDAtOUEtWl9hLXpcXHhBQVxceEI1XFx4QjdcXHhCQVxceEMwLVxceEQ2XFx4RDgtXFx4RjZcXHhGOC1cXHUwMkMxXFx1MDJDNi1cXHUwMkQxXFx1MDJFMC1cXHUwMkU0XFx1MDJFQ1xcdTAyRUVcXHUwMzAwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN0EtXFx1MDM3RFxcdTAzN0ZcXHUwMzg2LVxcdTAzOEFcXHUwMzhDXFx1MDM4RS1cXHUwM0ExXFx1MDNBMy1cXHUwM0Y1XFx1MDNGNy1cXHUwNDgxXFx1MDQ4My1cXHUwNDg3XFx1MDQ4QS1cXHUwNTJGXFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1OTEtXFx1MDVCRFxcdTA1QkZcXHUwNUMxXFx1MDVDMlxcdTA1QzRcXHUwNUM1XFx1MDVDN1xcdTA1RDAtXFx1MDVFQVxcdTA1RjAtXFx1MDVGMlxcdTA2MTAtXFx1MDYxQVxcdTA2MjAtXFx1MDY2OVxcdTA2NkUtXFx1MDZEM1xcdTA2RDUtXFx1MDZEQ1xcdTA2REYtXFx1MDZFOFxcdTA2RUEtXFx1MDZGQ1xcdTA2RkZcXHUwNzEwLVxcdTA3NEFcXHUwNzRELVxcdTA3QjFcXHUwN0MwLVxcdTA3RjVcXHUwN0ZBXFx1MDgwMC1cXHUwODJEXFx1MDg0MC1cXHUwODVCXFx1MDhBMC1cXHUwOEI0XFx1MDhFMy1cXHUwOTYzXFx1MDk2Ni1cXHUwOTZGXFx1MDk3MS1cXHUwOTgzXFx1MDk4NS1cXHUwOThDXFx1MDk4RlxcdTA5OTBcXHUwOTkzLVxcdTA5QThcXHUwOUFBLVxcdTA5QjBcXHUwOUIyXFx1MDlCNi1cXHUwOUI5XFx1MDlCQy1cXHUwOUM0XFx1MDlDN1xcdTA5QzhcXHUwOUNCLVxcdTA5Q0VcXHUwOUQ3XFx1MDlEQ1xcdTA5RERcXHUwOURGLVxcdTA5RTNcXHUwOUU2LVxcdTA5RjFcXHUwQTAxLVxcdTBBMDNcXHUwQTA1LVxcdTBBMEFcXHUwQTBGXFx1MEExMFxcdTBBMTMtXFx1MEEyOFxcdTBBMkEtXFx1MEEzMFxcdTBBMzJcXHUwQTMzXFx1MEEzNVxcdTBBMzZcXHUwQTM4XFx1MEEzOVxcdTBBM0NcXHUwQTNFLVxcdTBBNDJcXHUwQTQ3XFx1MEE0OFxcdTBBNEItXFx1MEE0RFxcdTBBNTFcXHUwQTU5LVxcdTBBNUNcXHUwQTVFXFx1MEE2Ni1cXHUwQTc1XFx1MEE4MS1cXHUwQTgzXFx1MEE4NS1cXHUwQThEXFx1MEE4Ri1cXHUwQTkxXFx1MEE5My1cXHUwQUE4XFx1MEFBQS1cXHUwQUIwXFx1MEFCMlxcdTBBQjNcXHUwQUI1LVxcdTBBQjlcXHUwQUJDLVxcdTBBQzVcXHUwQUM3LVxcdTBBQzlcXHUwQUNCLVxcdTBBQ0RcXHUwQUQwXFx1MEFFMC1cXHUwQUUzXFx1MEFFNi1cXHUwQUVGXFx1MEFGOVxcdTBCMDEtXFx1MEIwM1xcdTBCMDUtXFx1MEIwQ1xcdTBCMEZcXHUwQjEwXFx1MEIxMy1cXHUwQjI4XFx1MEIyQS1cXHUwQjMwXFx1MEIzMlxcdTBCMzNcXHUwQjM1LVxcdTBCMzlcXHUwQjNDLVxcdTBCNDRcXHUwQjQ3XFx1MEI0OFxcdTBCNEItXFx1MEI0RFxcdTBCNTZcXHUwQjU3XFx1MEI1Q1xcdTBCNURcXHUwQjVGLVxcdTBCNjNcXHUwQjY2LVxcdTBCNkZcXHUwQjcxXFx1MEI4MlxcdTBCODNcXHUwQjg1LVxcdTBCOEFcXHUwQjhFLVxcdTBCOTBcXHUwQjkyLVxcdTBCOTVcXHUwQjk5XFx1MEI5QVxcdTBCOUNcXHUwQjlFXFx1MEI5RlxcdTBCQTNcXHUwQkE0XFx1MEJBOC1cXHUwQkFBXFx1MEJBRS1cXHUwQkI5XFx1MEJCRS1cXHUwQkMyXFx1MEJDNi1cXHUwQkM4XFx1MEJDQS1cXHUwQkNEXFx1MEJEMFxcdTBCRDdcXHUwQkU2LVxcdTBCRUZcXHUwQzAwLVxcdTBDMDNcXHUwQzA1LVxcdTBDMENcXHUwQzBFLVxcdTBDMTBcXHUwQzEyLVxcdTBDMjhcXHUwQzJBLVxcdTBDMzlcXHUwQzNELVxcdTBDNDRcXHUwQzQ2LVxcdTBDNDhcXHUwQzRBLVxcdTBDNERcXHUwQzU1XFx1MEM1NlxcdTBDNTgtXFx1MEM1QVxcdTBDNjAtXFx1MEM2M1xcdTBDNjYtXFx1MEM2RlxcdTBDODEtXFx1MEM4M1xcdTBDODUtXFx1MEM4Q1xcdTBDOEUtXFx1MEM5MFxcdTBDOTItXFx1MENBOFxcdTBDQUEtXFx1MENCM1xcdTBDQjUtXFx1MENCOVxcdTBDQkMtXFx1MENDNFxcdTBDQzYtXFx1MENDOFxcdTBDQ0EtXFx1MENDRFxcdTBDRDVcXHUwQ0Q2XFx1MENERVxcdTBDRTAtXFx1MENFM1xcdTBDRTYtXFx1MENFRlxcdTBDRjFcXHUwQ0YyXFx1MEQwMS1cXHUwRDAzXFx1MEQwNS1cXHUwRDBDXFx1MEQwRS1cXHUwRDEwXFx1MEQxMi1cXHUwRDNBXFx1MEQzRC1cXHUwRDQ0XFx1MEQ0Ni1cXHUwRDQ4XFx1MEQ0QS1cXHUwRDRFXFx1MEQ1N1xcdTBENUYtXFx1MEQ2M1xcdTBENjYtXFx1MEQ2RlxcdTBEN0EtXFx1MEQ3RlxcdTBEODJcXHUwRDgzXFx1MEQ4NS1cXHUwRDk2XFx1MEQ5QS1cXHUwREIxXFx1MERCMy1cXHUwREJCXFx1MERCRFxcdTBEQzAtXFx1MERDNlxcdTBEQ0FcXHUwRENGLVxcdTBERDRcXHUwREQ2XFx1MEREOC1cXHUwRERGXFx1MERFNi1cXHUwREVGXFx1MERGMlxcdTBERjNcXHUwRTAxLVxcdTBFM0FcXHUwRTQwLVxcdTBFNEVcXHUwRTUwLVxcdTBFNTlcXHUwRTgxXFx1MEU4MlxcdTBFODRcXHUwRTg3XFx1MEU4OFxcdTBFOEFcXHUwRThEXFx1MEU5NC1cXHUwRTk3XFx1MEU5OS1cXHUwRTlGXFx1MEVBMS1cXHUwRUEzXFx1MEVBNVxcdTBFQTdcXHUwRUFBXFx1MEVBQlxcdTBFQUQtXFx1MEVCOVxcdTBFQkItXFx1MEVCRFxcdTBFQzAtXFx1MEVDNFxcdTBFQzZcXHUwRUM4LVxcdTBFQ0RcXHUwRUQwLVxcdTBFRDlcXHUwRURDLVxcdTBFREZcXHUwRjAwXFx1MEYxOFxcdTBGMTlcXHUwRjIwLVxcdTBGMjlcXHUwRjM1XFx1MEYzN1xcdTBGMzlcXHUwRjNFLVxcdTBGNDdcXHUwRjQ5LVxcdTBGNkNcXHUwRjcxLVxcdTBGODRcXHUwRjg2LVxcdTBGOTdcXHUwRjk5LVxcdTBGQkNcXHUwRkM2XFx1MTAwMC1cXHUxMDQ5XFx1MTA1MC1cXHUxMDlEXFx1MTBBMC1cXHUxMEM1XFx1MTBDN1xcdTEwQ0RcXHUxMEQwLVxcdTEwRkFcXHUxMEZDLVxcdTEyNDhcXHUxMjRBLVxcdTEyNERcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1QS1cXHUxMjVEXFx1MTI2MC1cXHUxMjg4XFx1MTI4QS1cXHUxMjhEXFx1MTI5MC1cXHUxMkIwXFx1MTJCMi1cXHUxMkI1XFx1MTJCOC1cXHUxMkJFXFx1MTJDMFxcdTEyQzItXFx1MTJDNVxcdTEyQzgtXFx1MTJENlxcdTEyRDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1QVxcdTEzNUQtXFx1MTM1RlxcdTEzNjktXFx1MTM3MVxcdTEzODAtXFx1MTM4RlxcdTEzQTAtXFx1MTNGNVxcdTEzRjgtXFx1MTNGRFxcdTE0MDEtXFx1MTY2Q1xcdTE2NkYtXFx1MTY3RlxcdTE2ODEtXFx1MTY5QVxcdTE2QTAtXFx1MTZFQVxcdTE2RUUtXFx1MTZGOFxcdTE3MDAtXFx1MTcwQ1xcdTE3MEUtXFx1MTcxNFxcdTE3MjAtXFx1MTczNFxcdTE3NDAtXFx1MTc1M1xcdTE3NjAtXFx1MTc2Q1xcdTE3NkUtXFx1MTc3MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN0QzXFx1MTdEN1xcdTE3RENcXHUxN0REXFx1MTdFMC1cXHUxN0U5XFx1MTgwQi1cXHUxODBEXFx1MTgxMC1cXHUxODE5XFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOEFBXFx1MThCMC1cXHUxOEY1XFx1MTkwMC1cXHUxOTFFXFx1MTkyMC1cXHUxOTJCXFx1MTkzMC1cXHUxOTNCXFx1MTk0Ni1cXHUxOTZEXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOUFCXFx1MTlCMC1cXHUxOUM5XFx1MTlEMC1cXHUxOURBXFx1MUEwMC1cXHUxQTFCXFx1MUEyMC1cXHUxQTVFXFx1MUE2MC1cXHUxQTdDXFx1MUE3Ri1cXHUxQTg5XFx1MUE5MC1cXHUxQTk5XFx1MUFBN1xcdTFBQjAtXFx1MUFCRFxcdTFCMDAtXFx1MUI0QlxcdTFCNTAtXFx1MUI1OVxcdTFCNkItXFx1MUI3M1xcdTFCODAtXFx1MUJGM1xcdTFDMDAtXFx1MUMzN1xcdTFDNDAtXFx1MUM0OVxcdTFDNEQtXFx1MUM3RFxcdTFDRDAtXFx1MUNEMlxcdTFDRDQtXFx1MUNGNlxcdTFDRjhcXHUxQ0Y5XFx1MUQwMC1cXHUxREY1XFx1MURGQy1cXHUxRjE1XFx1MUYxOC1cXHUxRjFEXFx1MUYyMC1cXHUxRjQ1XFx1MUY0OC1cXHUxRjREXFx1MUY1MC1cXHUxRjU3XFx1MUY1OVxcdTFGNUJcXHUxRjVEXFx1MUY1Ri1cXHUxRjdEXFx1MUY4MC1cXHUxRkI0XFx1MUZCNi1cXHUxRkJDXFx1MUZCRVxcdTFGQzItXFx1MUZDNFxcdTFGQzYtXFx1MUZDQ1xcdTFGRDAtXFx1MUZEM1xcdTFGRDYtXFx1MUZEQlxcdTFGRTAtXFx1MUZFQ1xcdTFGRjItXFx1MUZGNFxcdTFGRjYtXFx1MUZGQ1xcdTIwMENcXHUyMDBEXFx1MjAzRlxcdTIwNDBcXHUyMDU0XFx1MjA3MVxcdTIwN0ZcXHUyMDkwLVxcdTIwOUNcXHUyMEQwLVxcdTIwRENcXHUyMEUxXFx1MjBFNS1cXHUyMEYwXFx1MjEwMlxcdTIxMDdcXHUyMTBBLVxcdTIxMTNcXHUyMTE1XFx1MjExOC1cXHUyMTFEXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyQS1cXHUyMTM5XFx1MjEzQy1cXHUyMTNGXFx1MjE0NS1cXHUyMTQ5XFx1MjE0RVxcdTIxNjAtXFx1MjE4OFxcdTJDMDAtXFx1MkMyRVxcdTJDMzAtXFx1MkM1RVxcdTJDNjAtXFx1MkNFNFxcdTJDRUItXFx1MkNGM1xcdTJEMDAtXFx1MkQyNVxcdTJEMjdcXHUyRDJEXFx1MkQzMC1cXHUyRDY3XFx1MkQ2RlxcdTJEN0YtXFx1MkQ5NlxcdTJEQTAtXFx1MkRBNlxcdTJEQTgtXFx1MkRBRVxcdTJEQjAtXFx1MkRCNlxcdTJEQjgtXFx1MkRCRVxcdTJEQzAtXFx1MkRDNlxcdTJEQzgtXFx1MkRDRVxcdTJERDAtXFx1MkRENlxcdTJERDgtXFx1MkRERVxcdTJERTAtXFx1MkRGRlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyRlxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzQ1xcdTMwNDEtXFx1MzA5NlxcdTMwOTktXFx1MzA5RlxcdTMwQTEtXFx1MzBGQVxcdTMwRkMtXFx1MzBGRlxcdTMxMDUtXFx1MzEyRFxcdTMxMzEtXFx1MzE4RVxcdTMxQTAtXFx1MzFCQVxcdTMxRjAtXFx1MzFGRlxcdTM0MDAtXFx1NERCNVxcdTRFMDAtXFx1OUZENVxcdUEwMDAtXFx1QTQ4Q1xcdUE0RDAtXFx1QTRGRFxcdUE1MDAtXFx1QTYwQ1xcdUE2MTAtXFx1QTYyQlxcdUE2NDAtXFx1QTY2RlxcdUE2NzQtXFx1QTY3RFxcdUE2N0YtXFx1QTZGMVxcdUE3MTctXFx1QTcxRlxcdUE3MjItXFx1QTc4OFxcdUE3OEItXFx1QTdBRFxcdUE3QjAtXFx1QTdCN1xcdUE3RjctXFx1QTgyN1xcdUE4NDAtXFx1QTg3M1xcdUE4ODAtXFx1QThDNFxcdUE4RDAtXFx1QThEOVxcdUE4RTAtXFx1QThGN1xcdUE4RkJcXHVBOEZEXFx1QTkwMC1cXHVBOTJEXFx1QTkzMC1cXHVBOTUzXFx1QTk2MC1cXHVBOTdDXFx1QTk4MC1cXHVBOUMwXFx1QTlDRi1cXHVBOUQ5XFx1QTlFMC1cXHVBOUZFXFx1QUEwMC1cXHVBQTM2XFx1QUE0MC1cXHVBQTREXFx1QUE1MC1cXHVBQTU5XFx1QUE2MC1cXHVBQTc2XFx1QUE3QS1cXHVBQUMyXFx1QUFEQi1cXHVBQUREXFx1QUFFMC1cXHVBQUVGXFx1QUFGMi1cXHVBQUY2XFx1QUIwMS1cXHVBQjA2XFx1QUIwOS1cXHVBQjBFXFx1QUIxMS1cXHVBQjE2XFx1QUIyMC1cXHVBQjI2XFx1QUIyOC1cXHVBQjJFXFx1QUIzMC1cXHVBQjVBXFx1QUI1Qy1cXHVBQjY1XFx1QUI3MC1cXHVBQkVBXFx1QUJFQ1xcdUFCRURcXHVBQkYwLVxcdUFCRjlcXHVBQzAwLVxcdUQ3QTNcXHVEN0IwLVxcdUQ3QzZcXHVEN0NCLVxcdUQ3RkJcXHVGOTAwLVxcdUZBNkRcXHVGQTcwLVxcdUZBRDlcXHVGQjAwLVxcdUZCMDZcXHVGQjEzLVxcdUZCMTdcXHVGQjFELVxcdUZCMjhcXHVGQjJBLVxcdUZCMzZcXHVGQjM4LVxcdUZCM0NcXHVGQjNFXFx1RkI0MFxcdUZCNDFcXHVGQjQzXFx1RkI0NFxcdUZCNDYtXFx1RkJCMVxcdUZCRDMtXFx1RkQzRFxcdUZENTAtXFx1RkQ4RlxcdUZEOTItXFx1RkRDN1xcdUZERjAtXFx1RkRGQlxcdUZFMDAtXFx1RkUwRlxcdUZFMjAtXFx1RkUyRlxcdUZFMzNcXHVGRTM0XFx1RkU0RC1cXHVGRTRGXFx1RkU3MC1cXHVGRTc0XFx1RkU3Ni1cXHVGRUZDXFx1RkYxMC1cXHVGRjE5XFx1RkYyMS1cXHVGRjNBXFx1RkYzRlxcdUZGNDEtXFx1RkY1QVxcdUZGNjYtXFx1RkZCRVxcdUZGQzItXFx1RkZDN1xcdUZGQ0EtXFx1RkZDRlxcdUZGRDItXFx1RkZEN1xcdUZGREEtXFx1RkZEQ118XFx1RDgwMFtcXHVEQzAwLVxcdURDMEJcXHVEQzBELVxcdURDMjZcXHVEQzI4LVxcdURDM0FcXHVEQzNDXFx1REMzRFxcdURDM0YtXFx1REM0RFxcdURDNTAtXFx1REM1RFxcdURDODAtXFx1RENGQVxcdURENDAtXFx1REQ3NFxcdURERkRcXHVERTgwLVxcdURFOUNcXHVERUEwLVxcdURFRDBcXHVERUUwXFx1REYwMC1cXHVERjFGXFx1REYzMC1cXHVERjRBXFx1REY1MC1cXHVERjdBXFx1REY4MC1cXHVERjlEXFx1REZBMC1cXHVERkMzXFx1REZDOC1cXHVERkNGXFx1REZEMS1cXHVERkQ1XXxcXHVEODAxW1xcdURDMDAtXFx1REM5RFxcdURDQTAtXFx1RENBOVxcdUREMDAtXFx1REQyN1xcdUREMzAtXFx1REQ2M1xcdURFMDAtXFx1REYzNlxcdURGNDAtXFx1REY1NVxcdURGNjAtXFx1REY2N118XFx1RDgwMltcXHVEQzAwLVxcdURDMDVcXHVEQzA4XFx1REMwQS1cXHVEQzM1XFx1REMzN1xcdURDMzhcXHVEQzNDXFx1REMzRi1cXHVEQzU1XFx1REM2MC1cXHVEQzc2XFx1REM4MC1cXHVEQzlFXFx1RENFMC1cXHVEQ0YyXFx1RENGNFxcdURDRjVcXHVERDAwLVxcdUREMTVcXHVERDIwLVxcdUREMzlcXHVERDgwLVxcdUREQjdcXHVEREJFXFx1RERCRlxcdURFMDAtXFx1REUwM1xcdURFMDVcXHVERTA2XFx1REUwQy1cXHVERTEzXFx1REUxNS1cXHVERTE3XFx1REUxOS1cXHVERTMzXFx1REUzOC1cXHVERTNBXFx1REUzRlxcdURFNjAtXFx1REU3Q1xcdURFODAtXFx1REU5Q1xcdURFQzAtXFx1REVDN1xcdURFQzktXFx1REVFNlxcdURGMDAtXFx1REYzNVxcdURGNDAtXFx1REY1NVxcdURGNjAtXFx1REY3MlxcdURGODAtXFx1REY5MV18XFx1RDgwM1tcXHVEQzAwLVxcdURDNDhcXHVEQzgwLVxcdURDQjJcXHVEQ0MwLVxcdURDRjJdfFxcdUQ4MDRbXFx1REMwMC1cXHVEQzQ2XFx1REM2Ni1cXHVEQzZGXFx1REM3Ri1cXHVEQ0JBXFx1RENEMC1cXHVEQ0U4XFx1RENGMC1cXHVEQ0Y5XFx1REQwMC1cXHVERDM0XFx1REQzNi1cXHVERDNGXFx1REQ1MC1cXHVERDczXFx1REQ3NlxcdUREODAtXFx1RERDNFxcdUREQ0EtXFx1RERDQ1xcdURERDAtXFx1REREQVxcdURERENcXHVERTAwLVxcdURFMTFcXHVERTEzLVxcdURFMzdcXHVERTgwLVxcdURFODZcXHVERTg4XFx1REU4QS1cXHVERThEXFx1REU4Ri1cXHVERTlEXFx1REU5Ri1cXHVERUE4XFx1REVCMC1cXHVERUVBXFx1REVGMC1cXHVERUY5XFx1REYwMC1cXHVERjAzXFx1REYwNS1cXHVERjBDXFx1REYwRlxcdURGMTBcXHVERjEzLVxcdURGMjhcXHVERjJBLVxcdURGMzBcXHVERjMyXFx1REYzM1xcdURGMzUtXFx1REYzOVxcdURGM0MtXFx1REY0NFxcdURGNDdcXHVERjQ4XFx1REY0Qi1cXHVERjREXFx1REY1MFxcdURGNTdcXHVERjVELVxcdURGNjNcXHVERjY2LVxcdURGNkNcXHVERjcwLVxcdURGNzRdfFxcdUQ4MDVbXFx1REM4MC1cXHVEQ0M1XFx1RENDN1xcdURDRDAtXFx1RENEOVxcdUREODAtXFx1RERCNVxcdUREQjgtXFx1RERDMFxcdURERDgtXFx1RERERFxcdURFMDAtXFx1REU0MFxcdURFNDRcXHVERTUwLVxcdURFNTlcXHVERTgwLVxcdURFQjdcXHVERUMwLVxcdURFQzlcXHVERjAwLVxcdURGMTlcXHVERjFELVxcdURGMkJcXHVERjMwLVxcdURGMzldfFxcdUQ4MDZbXFx1RENBMC1cXHVEQ0U5XFx1RENGRlxcdURFQzAtXFx1REVGOF18XFx1RDgwOFtcXHVEQzAwLVxcdURGOTldfFxcdUQ4MDlbXFx1REMwMC1cXHVEQzZFXFx1REM4MC1cXHVERDQzXXxbXFx1RDgwQ1xcdUQ4NDAtXFx1RDg2OFxcdUQ4NkEtXFx1RDg2Q1xcdUQ4NkYtXFx1RDg3Ml1bXFx1REMwMC1cXHVERkZGXXxcXHVEODBEW1xcdURDMDAtXFx1REMyRV18XFx1RDgxMVtcXHVEQzAwLVxcdURFNDZdfFxcdUQ4MUFbXFx1REMwMC1cXHVERTM4XFx1REU0MC1cXHVERTVFXFx1REU2MC1cXHVERTY5XFx1REVEMC1cXHVERUVEXFx1REVGMC1cXHVERUY0XFx1REYwMC1cXHVERjM2XFx1REY0MC1cXHVERjQzXFx1REY1MC1cXHVERjU5XFx1REY2My1cXHVERjc3XFx1REY3RC1cXHVERjhGXXxcXHVEODFCW1xcdURGMDAtXFx1REY0NFxcdURGNTAtXFx1REY3RVxcdURGOEYtXFx1REY5Rl18XFx1RDgyQ1tcXHVEQzAwXFx1REMwMV18XFx1RDgyRltcXHVEQzAwLVxcdURDNkFcXHVEQzcwLVxcdURDN0NcXHVEQzgwLVxcdURDODhcXHVEQzkwLVxcdURDOTlcXHVEQzlEXFx1REM5RV18XFx1RDgzNFtcXHVERDY1LVxcdURENjlcXHVERDZELVxcdURENzJcXHVERDdCLVxcdUREODJcXHVERDg1LVxcdUREOEJcXHVEREFBLVxcdUREQURcXHVERTQyLVxcdURFNDRdfFxcdUQ4MzVbXFx1REMwMC1cXHVEQzU0XFx1REM1Ni1cXHVEQzlDXFx1REM5RVxcdURDOUZcXHVEQ0EyXFx1RENBNVxcdURDQTZcXHVEQ0E5LVxcdURDQUNcXHVEQ0FFLVxcdURDQjlcXHVEQ0JCXFx1RENCRC1cXHVEQ0MzXFx1RENDNS1cXHVERDA1XFx1REQwNy1cXHVERDBBXFx1REQwRC1cXHVERDE0XFx1REQxNi1cXHVERDFDXFx1REQxRS1cXHVERDM5XFx1REQzQi1cXHVERDNFXFx1REQ0MC1cXHVERDQ0XFx1REQ0NlxcdURENEEtXFx1REQ1MFxcdURENTItXFx1REVBNVxcdURFQTgtXFx1REVDMFxcdURFQzItXFx1REVEQVxcdURFREMtXFx1REVGQVxcdURFRkMtXFx1REYxNFxcdURGMTYtXFx1REYzNFxcdURGMzYtXFx1REY0RVxcdURGNTAtXFx1REY2RVxcdURGNzAtXFx1REY4OFxcdURGOEEtXFx1REZBOFxcdURGQUEtXFx1REZDMlxcdURGQzQtXFx1REZDQlxcdURGQ0UtXFx1REZGRl18XFx1RDgzNltcXHVERTAwLVxcdURFMzZcXHVERTNCLVxcdURFNkNcXHVERTc1XFx1REU4NFxcdURFOUItXFx1REU5RlxcdURFQTEtXFx1REVBRl18XFx1RDgzQVtcXHVEQzAwLVxcdURDQzRcXHVEQ0QwLVxcdURDRDZdfFxcdUQ4M0JbXFx1REUwMC1cXHVERTAzXFx1REUwNS1cXHVERTFGXFx1REUyMVxcdURFMjJcXHVERTI0XFx1REUyN1xcdURFMjktXFx1REUzMlxcdURFMzQtXFx1REUzN1xcdURFMzlcXHVERTNCXFx1REU0MlxcdURFNDdcXHVERTQ5XFx1REU0QlxcdURFNEQtXFx1REU0RlxcdURFNTFcXHVERTUyXFx1REU1NFxcdURFNTdcXHVERTU5XFx1REU1QlxcdURFNURcXHVERTVGXFx1REU2MVxcdURFNjJcXHVERTY0XFx1REU2Ny1cXHVERTZBXFx1REU2Qy1cXHVERTcyXFx1REU3NC1cXHVERTc3XFx1REU3OS1cXHVERTdDXFx1REU3RVxcdURFODAtXFx1REU4OVxcdURFOEItXFx1REU5QlxcdURFQTEtXFx1REVBM1xcdURFQTUtXFx1REVBOVxcdURFQUItXFx1REVCQl18XFx1RDg2OVtcXHVEQzAwLVxcdURFRDZcXHVERjAwLVxcdURGRkZdfFxcdUQ4NkRbXFx1REMwMC1cXHVERjM0XFx1REY0MC1cXHVERkZGXXxcXHVEODZFW1xcdURDMDAtXFx1REMxRFxcdURDMjAtXFx1REZGRl18XFx1RDg3M1tcXHVEQzAwLVxcdURFQTFdfFxcdUQ4N0VbXFx1REMwMC1cXHVERTFEXXxcXHVEQjQwW1xcdUREMDAtXFx1RERFRl0pKiQvXG4gIGpzaWRlbnRpZmllcl9wYXR0ZXJuID0gL14oPzpbJF9dfFxccHtJRF9TdGFydH0pKD86WyRfXFx1ezIwMGN9XFx1ezIwMGR9XXxcXHB7SURfQ29udGludWV9KSokL3U7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBYTUwgTmFtZXMsIElEc1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8qXG5cbiAgKiBodHRwczovL3d3dy53My5vcmcvVFIveG1sLyNOVC1OYW1lXG4gICogT2JzZXJ2ZSB0aGF0IGluIEhUTUw1IChidXQgbm90IGVhcmxpZXIgdmVyc2lvbnMpLCBtb3N0IHJlc3RyaWN0aW9ucyBvbiBJRCB2YWx1ZXMgaGF2ZSBiZWVuIHJlbW92ZWQ7IHRvXG4gICAgcXVvdGU6IFwiVGhlcmUgYXJlIG5vIG90aGVyIHJlc3RyaWN0aW9ucyBvbiB3aGF0IGZvcm0gYW4gSUQgY2FuIHRha2U7IGluIHBhcnRpY3VsYXIsIElEcyBjYW4gY29uc2lzdCBvZlxuICAgIGp1c3QgZGlnaXRzLCBzdGFydCB3aXRoIGEgZGlnaXQsIHN0YXJ0IHdpdGggYW4gdW5kZXJzY29yZSwgY29uc2lzdCBvZiBqdXN0IHB1bmN0dWF0aW9uLCBldGMuXCJcblxuICBbNF0gICAgIE5hbWVTdGFydENoYXIgICAgOjo9ICAgIFwiOlwiIHwgW0EtWl0gfCBcIl9cIiB8IFthLXpdIHwgWyN4QzAtI3hENl0gfCBbI3hEOC0jeEY2XSB8IFsjeEY4LSN4MkZGXSB8IFsjeDM3MC0jeDM3RF0gfCBbI3gzN0YtI3gxRkZGXSB8IFsjeDIwMEMtI3gyMDBEXSB8IFsjeDIwNzAtI3gyMThGXSB8IFsjeDJDMDAtI3gyRkVGXSB8IFsjeDMwMDEtI3hEN0ZGXSB8IFsjeEY5MDAtI3hGRENGXSB8IFsjeEZERjAtI3hGRkZEXSB8IFsjeDEwMDAwLSN4RUZGRkZdXG4gIFs0YV0gICAgTmFtZUNoYXIgICAgIDo6PSAgICBOYW1lU3RhcnRDaGFyIHwgXCItXCIgfCBcIi5cIiB8IFswLTldIHwgI3hCNyB8IFsjeDAzMDAtI3gwMzZGXSB8IFsjeDIwM0YtI3gyMDQwXVxuICBbNV0gICAgIE5hbWUgICAgIDo6PSAgICBOYW1lU3RhcnRDaGFyIChOYW1lQ2hhcikqXG5cbiAgICovXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gT1RGIEdseXBoIE5hbWVzXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLypcblxuICBGcm9tIGh0dHBzOi8vYWRvYmUtdHlwZS10b29scy5naXRodWIuaW8vYWZka28vT3BlblR5cGVGZWF0dXJlRmlsZVNwZWNpZmljYXRpb24uaHRtbCMyLmYuaVxuXG4gID4gQSBnbHlwaCBuYW1lIG1heSBiZSB1cCB0byA2MyBjaGFyYWN0ZXJzIGluIGxlbmd0aCwgbXVzdCBiZSBlbnRpcmVseSBjb21wcmlzZWQgb2YgY2hhcmFjdGVycyBmcm9tIHRoZVxuICA+IGZvbGxvd2luZyBzZXQ6XG4gID5cbiAgPiBgYGBcbiAgPiBBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWlxuICA+IGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XG4gID4gMDEyMzQ1Njc4OVxuICA+IC4gICMgcGVyaW9kXG4gID4gXyAgIyB1bmRlcnNjb3JlXG4gID4gYGBgXG4gID5cbiAgPiBhbmQgbXVzdCBub3Qgc3RhcnQgd2l0aCBhIGRpZ2l0IG9yIHBlcmlvZC4gVGhlIG9ubHkgZXhjZXB0aW9uIGlzIHRoZSBzcGVjaWFsIGNoYXJhY3RlciDigJwubm90ZGVm4oCdLlxuICA+XG4gID4g4oCcdHdvY2VudHPigJ0sIOKAnGEx4oCdLCBhbmQg4oCcX+KAnSBhcmUgdmFsaWQgZ2x5cGggbmFtZXMuIOKAnDJjZW50c+KAnSBhbmQg4oCcLnR3b2NlbnRz4oCdIGFyZSDigJxub3QuXG5cbiAgKi9cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBUWVBFIERFQ0xBUkFUSU9OU1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuZGVjbGFyZV90eXBlcyA9IGZ1bmN0aW9uKCkge1xuICAgIC8qIE5PVEUgdG8gYmUgY2FsbGVkIGFzIGAoIHJlcXVpcmUgJy4vZGVjbGFyYXRpb25zJyApLmRlY2xhcmVfdHlwZXMuYXBwbHkgaW5zdGFuY2VgICovXG4gICAgdGhpcy5kZWNsYXJlKCdudWxsJywgKHgpID0+IHtcbiAgICAgIHJldHVybiB4ID09PSBudWxsO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgndW5kZWZpbmVkJywgKHgpID0+IHtcbiAgICAgIHJldHVybiB4ID09PSB2b2lkIDA7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ3NhZCcsICh4KSA9PiB7XG4gICAgICByZXR1cm4gQ0hFQ0tTLmlzX3NhZCh4KTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2hhcHB5JywgKHgpID0+IHtcbiAgICAgIHJldHVybiBDSEVDS1MuaXNfaGFwcHkoeCk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdzYWRkZW5lZCcsICh4KSA9PiB7XG4gICAgICByZXR1cm4gQ0hFQ0tTLmlzX3NhZGRlbmVkKHgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnc3ltYm9sJywgKHgpID0+IHtcbiAgICAgIHJldHVybiB0eXBlb2YgeCA9PT0gJ3N5bWJvbCc7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2Jvb2xlYW4nLCB7XG4gICAgICB0ZXN0czoge1xuICAgICAgICBcInggaXMgdHJ1ZSBvciBmYWxzZVwiOiAoeCkgPT4ge1xuICAgICAgICAgIHJldHVybiAoeCA9PT0gdHJ1ZSkgfHwgKHggPT09IGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNhc3RzOiB7XG4gICAgICAgIGZsb2F0OiAoeCkgPT4ge1xuICAgICAgICAgIGlmICh4KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ25hbicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzTmFOKHgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZmluaXRlJywgKHgpID0+IHtcbiAgICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUoeCk7XG4gICAgfSk7XG4gICAgdGhpcy4vKiBUQUlOVCBtYWtlIHN1cmUgbm8gbm9uLW51bWJlcnMgc2xpcCB0aHJvdWdoICovZGVjbGFyZSgnaW50ZWdlcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlcih4KTtcbiAgICB9KTtcbiAgICB0aGlzLi8qIFRBSU5UIG1ha2Ugc3VyZSBubyBub24tbnVtYmVycyBzbGlwIHRocm91Z2ggKi9kZWNsYXJlKCdzYWZlaW50ZWdlcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gTnVtYmVyLmlzU2FmZUludGVnZXIoeCk7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAvKiBGVFRCIHdlIGFyZSByZXRhaW5pbmcgYG51bWJlcmAgYXMgYSBsZXNzLXByZWZlcnJlZCBzeW5vbnltIGZvciBgZmxvYXRgOyBpbiB0aGUgZnV0dXJlLCBgbnVtYmVyYCBtYXlcbiAgICAgYmUgcmVtb3ZlZCBiZWNhdXNlIGl0IGNvbmZsaWN0cyB3aXRoIEpTIHVzYWdlICh3aGVyZSBpdCBpbmNsdWRlcyBgTmFOYCBhbmQgYCsvLUluZmluaXR5YCkgYW5kLCBtb3Jlb3ZlcixcbiAgICAgaXMgbm90IHRydXRoZnVsIChiZWNhdXNlIGl0IGlzIGEgcG9vciByZXByZXNlbnRhdGlvbiBvZiB3aGF0IHRoZSBtb2Rlcm4gdW5kZXJzdGFuZGluZyBvZiAnbnVtYmVyJyBpbiB0aGVcbiAgICAgbWF0aGVtYXRpY2FsIHNlbnNlIHdvdWxkIGltcGx5KS4gKi9cbiAgICAvKiBOT1RFIHJlbW92ZWQgaW4gdjg6IGBAc3BlY3MubnVtYmVyID0gQHNwZWNzLmZsb2F0YCAqL1xuICAgIHRoaXMuLyogVEFJTlQgbWFrZSBzdXJlIG5vIG5vbi1udW1iZXJzIHNsaXAgdGhyb3VnaCAqL2RlY2xhcmUoJ251bWJlcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gZmFsc2U7IC8vIHRocm93IG5ldyBFcnJvciBcIl5pbnRlcnR5cGVAODQ3NDReIHR5cGUgJ251bWJlcicgaXMgZGVwcmVjYXRlZFwiXG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdmbG9hdCcsIHtcbiAgICAgIHRlc3RzOiAoeCkgPT4ge1xuICAgICAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHgpO1xuICAgICAgfSxcbiAgICAgIGNhc3RzOiB7XG4gICAgICAgIGJvb2xlYW46ICh4KSA9PiB7XG4gICAgICAgICAgaWYgKHggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbnRlZ2VyOiAoeCkgPT4ge1xuICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2Zyb3plbicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gT2JqZWN0LmlzRnJvemVuKHgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnc2VhbGVkJywgKHgpID0+IHtcbiAgICAgIHJldHVybiBPYmplY3QuaXNTZWFsZWQoeCk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdleHRlbnNpYmxlJywgKHgpID0+IHtcbiAgICAgIHJldHVybiBPYmplY3QuaXNFeHRlbnNpYmxlKHgpO1xuICAgIH0pO1xuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdGhpcy5kZWNsYXJlKCdudW1lcmljJywgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdudW1iZXInO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZnVuY3Rpb24nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2FzeW5jZnVuY3Rpb24nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2FzeW5jZnVuY3Rpb24nO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZ2VuZXJhdG9yZnVuY3Rpb24nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2dlbmVyYXRvcmZ1bmN0aW9uJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2FzeW5jZ2VuZXJhdG9yZnVuY3Rpb24nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2FzeW5jZ2VuZXJhdG9yZnVuY3Rpb24nO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnYXN5bmNnZW5lcmF0b3InLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2FzeW5jZ2VuZXJhdG9yJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2dlbmVyYXRvcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnZ2VuZXJhdG9yJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2RhdGUnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2RhdGUnO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbGlzdGl0ZXJhdG9yJywgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdhcnJheWl0ZXJhdG9yJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3RleHRpdGVyYXRvcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnc3RyaW5naXRlcmF0b3InO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnc2V0aXRlcmF0b3InLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ3NldGl0ZXJhdG9yJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ21hcGl0ZXJhdG9yJywgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdtYXBpdGVyYXRvcic7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdjYWxsYWJsZScsICh4KSA9PiB7XG4gICAgICB2YXIgcmVmO1xuICAgICAgcmV0dXJuIChyZWYgPSB0aGlzLnR5cGVfb2YoeCkpID09PSAnZnVuY3Rpb24nIHx8IHJlZiA9PT0gJ2FzeW5jZnVuY3Rpb24nIHx8IHJlZiA9PT0gJ2dlbmVyYXRvcmZ1bmN0aW9uJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3Byb21pc2UnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5uYXRpdmVwcm9taXNlKHgpKSB8fCAodGhpcy5pc2EudGhlbmFibGUoeCkpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbmF0aXZlcHJvbWlzZScsICh4KSA9PiB7XG4gICAgICByZXR1cm4geCBpbnN0YW5jZW9mIFByb21pc2U7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCd0aGVuYWJsZScsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKHRoaXMudHlwZV9vZih4ICE9IG51bGwgPyB4LnRoZW4gOiB2b2lkIDApKSA9PT0gJ2Z1bmN0aW9uJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2ltbWVkaWF0ZScsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAhdGhpcy5pc2EucHJvbWlzZSh4KTtcbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgndHJ1dGh5JywgKHgpID0+IHtcbiAgICAgIHJldHVybiAhIXg7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdmYWxzeScsICh4KSA9PiB7XG4gICAgICByZXR1cm4gIXg7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCd0cnVlJywgKHgpID0+IHtcbiAgICAgIHJldHVybiB4ID09PSB0cnVlO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZmFsc2UnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIHggPT09IGZhbHNlO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgndW5zZXQnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIHggPT0gbnVsbDtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25vdHVuc2V0JywgKHgpID0+IHtcbiAgICAgIHJldHVybiB4ICE9IG51bGw7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2V2ZW4nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5zYWZlaW50ZWdlcih4KSkgJiYgKG1vZHVsbyh4LCAyKSkgPT09IDA7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdvZGQnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5zYWZlaW50ZWdlcih4KSkgJiYgKG1vZHVsbyh4LCAyKSkgPT09IDE7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdjYXJkaW5hbCcsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAodGhpcy5pc2Euc2FmZWludGVnZXIoeCkpICYmICh0aGlzLmlzYS5ub25uZWdhdGl2ZSh4KSk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdub25uZWdhdGl2ZScsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLmluZmxvYXQoeCkpICYmICh4ID49IDApO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgncG9zaXRpdmUnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5pbmZsb2F0KHgpKSAmJiAoeCA+IDApO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgncG9zaXRpdmVfZmxvYXQnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5mbG9hdCh4KSkgJiYgKHggPiAwKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3Bvc2l0aXZlX2ludGVnZXInLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5pbnRlZ2VyKHgpKSAmJiAoeCA+IDApO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbmVnYXRpdmVfaW50ZWdlcicsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLmludGVnZXIoeCkpICYmICh4IDwgMCk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCd6ZXJvJywgKHgpID0+IHtcbiAgICAgIHJldHVybiB4ID09PSAwO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnaW5maW5pdHknLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh4ID09PSArMmUzMDgpIHx8ICh4ID09PSAtMmUzMDgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnaW5mbG9hdCcsICh4KSA9PiB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLmZsb2F0KHgpKSB8fCAoeCA9PT0gMmUzMDgpIHx8ICh4ID09PSAtMmUzMDgpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbm9ucG9zaXRpdmUnLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5pbmZsb2F0KHgpKSAmJiAoeCA8PSAwKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25lZ2F0aXZlJywgKHgpID0+IHtcbiAgICAgIHJldHVybiAodGhpcy5pc2EuaW5mbG9hdCh4KSkgJiYgKHggPCAwKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25lZ2F0aXZlX2Zsb2F0JywgKHgpID0+IHtcbiAgICAgIHJldHVybiAodGhpcy5pc2EuZmxvYXQoeCkpICYmICh4IDwgMCk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdwcm9wZXJfZnJhY3Rpb24nLCAoeCkgPT4ge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5mbG9hdCh4KSkgJiYgKCgwIDw9IHggJiYgeCA8PSAxKSk7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2VtcHR5JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmhhc19zaXplKHgpKSAmJiAodGhpcy5zaXplX29mKHgpKSA9PT0gMDtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3Npbmd1bGFyJywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmhhc19zaXplKHgpKSAmJiAodGhpcy5zaXplX29mKHgpKSA9PT0gMTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25vbmVtcHR5JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmhhc19zaXplKHgpKSAmJiAodGhpcy5zaXplX29mKHgpKSA+IDA7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdwbHVyYWwnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKHRoaXMuaGFzX3NpemUoeCkpICYmICh0aGlzLnNpemVfb2YoeCkpID4gMTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2JsYW5rX3RleHQnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLnRleHQoeCkpICYmICgoeC5tYXRjaCgvXlxccyokL3VzKSkgIT0gbnVsbCk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdub25ibGFua190ZXh0JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS50ZXh0KHgpKSAmJiAoKHgubWF0Y2goL15cXHMqJC91cykpID09IG51bGwpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnY2hyJywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS50ZXh0KHgpKSAmJiAoKHgubWF0Y2goL14uJC91cykpICE9IG51bGwpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbm9uZW1wdHlfdGV4dCcsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAodGhpcy5pc2EudGV4dCh4KSkgJiYgKHRoaXMuaXNhLm5vbmVtcHR5KHgpKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25vbmVtcHR5X2xpc3QnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLmxpc3QoeCkpICYmICh0aGlzLmlzYS5ub25lbXB0eSh4KSk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdub25lbXB0eV9vYmplY3QnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLm9iamVjdCh4KSkgJiYgKHRoaXMuaXNhLm5vbmVtcHR5KHgpKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ25vbmVtcHR5X3NldCcsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAodGhpcy5pc2Euc2V0KHgpKSAmJiAodGhpcy5pc2Eubm9uZW1wdHkoeCkpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnbm9uZW1wdHlfbWFwJywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5tYXAoeCkpICYmICh0aGlzLmlzYS5ub25lbXB0eSh4KSk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdlbXB0eV90ZXh0JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS50ZXh0KHgpKSAmJiAodGhpcy5pc2EuZW1wdHkoeCkpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZW1wdHlfbGlzdCcsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAodGhpcy5pc2EubGlzdCh4KSkgJiYgKHRoaXMuaXNhLmVtcHR5KHgpKTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2VtcHR5X29iamVjdCcsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIHJldHVybiAodGhpcy5pc2Eub2JqZWN0KHgpKSAmJiAodGhpcy5pc2EuZW1wdHkoeCkpO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZW1wdHlfc2V0JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5zZXQoeCkpICYmICh0aGlzLmlzYS5lbXB0eSh4KSk7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdlbXB0eV9tYXAnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKHRoaXMuaXNhLm1hcCh4KSkgJiYgKHRoaXMuaXNhLmVtcHR5KHgpKTtcbiAgICB9KTtcbiAgICAvLyBpc19naXZlbiAgICAgICAgICAgICAgICAgID0gKCB4ICkgLT4gbm90IFsgbnVsbCwgdW5kZWZpbmVkLCBOYU4sICcnLCBdLmluY2x1ZGVzIHhcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgnYnVmZmVyJywge1xuICAgICAgc2l6ZTogJ2xlbmd0aCdcbiAgICB9LCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIEJ1ZmZlci5pc0J1ZmZlcih4KTtcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2FycmF5YnVmZmVyJywge1xuICAgICAgc2l6ZTogJ2xlbmd0aCdcbiAgICB9LCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2FycmF5YnVmZmVyJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2ludDhhcnJheScsIHtcbiAgICAgIHNpemU6ICdsZW5ndGgnXG4gICAgfSwgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdpbnQ4YXJyYXknO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgndWludDhhcnJheScsIHtcbiAgICAgIHNpemU6ICdsZW5ndGgnXG4gICAgfSwgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICd1aW50OGFycmF5JztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3VpbnQ4Y2xhbXBlZGFycmF5Jywge1xuICAgICAgc2l6ZTogJ2xlbmd0aCdcbiAgICB9LCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ3VpbnQ4Y2xhbXBlZGFycmF5JztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2ludDE2YXJyYXknLCB7XG4gICAgICBzaXplOiAnbGVuZ3RoJ1xuICAgIH0sICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnaW50MTZhcnJheSc7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCd1aW50MTZhcnJheScsIHtcbiAgICAgIHNpemU6ICdsZW5ndGgnXG4gICAgfSwgKHgpID0+IHtcbiAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICd1aW50MTZhcnJheSc7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdpbnQzMmFycmF5Jywge1xuICAgICAgc2l6ZTogJ2xlbmd0aCdcbiAgICB9LCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2ludDMyYXJyYXknO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgndWludDMyYXJyYXknLCB7XG4gICAgICBzaXplOiAnbGVuZ3RoJ1xuICAgIH0sICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAndWludDMyYXJyYXknO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZmxvYXQzMmFycmF5Jywge1xuICAgICAgc2l6ZTogJ2xlbmd0aCdcbiAgICB9LCAoeCkgPT4ge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ2Zsb2F0MzJhcnJheSc7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdmbG9hdDY0YXJyYXknLCB7XG4gICAgICBzaXplOiAnbGVuZ3RoJ1xuICAgIH0sICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnZmxvYXQ2NGFycmF5JztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ2xpc3QnLCB7XG4gICAgICBzaXplOiAnbGVuZ3RoJ1xuICAgIH0sICh4KSA9PiB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnYXJyYXknO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnc2V0Jywge1xuICAgICAgc2l6ZTogJ3NpemUnXG4gICAgfSwgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ3NldCc7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCdtYXAnLCB7XG4gICAgICBzaXplOiAnc2l6ZSdcbiAgICB9LCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnbWFwJztcbiAgICB9KTtcbiAgICB0aGlzLmRlY2xhcmUoJ3dlYWttYXAnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnd2Vha21hcCc7XG4gICAgfSk7XG4gICAgdGhpcy5kZWNsYXJlKCd3ZWFrc2V0JywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuIChqc190eXBlX29mKHgpKSA9PT0gJ3dlYWtzZXQnO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgnZXJyb3InLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnZXJyb3InO1xuICAgIH0pO1xuICAgIHRoaXMuZGVjbGFyZSgncmVnZXgnLCBmdW5jdGlvbih4KSB7XG4gICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAncmVnZXhwJztcbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgnb2JqZWN0Jywge1xuICAgICAgdGVzdHM6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdvYmplY3QnO1xuICAgICAgfSxcbiAgICAgIHNpemU6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAoT2JqZWN0LmtleXMoeCkpLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgnZ2xvYmFsJywge1xuICAgICAgdGVzdHM6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAoanNfdHlwZV9vZih4KSkgPT09ICdnbG9iYWwnO1xuICAgICAgfSxcbiAgICAgIHNpemU6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAoT2JqZWN0LmtleXMoeCkpLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgndGV4dCcsIHtcbiAgICAgIHRlc3RzOiAoeCkgPT4ge1xuICAgICAgICByZXR1cm4gKGpzX3R5cGVfb2YoeCkpID09PSAnc3RyaW5nJztcbiAgICAgIH0sXG4gICAgICBzaXplOiBmdW5jdGlvbih4LCBzZWxlY3RvciA9ICdjb2RldW5pdHMnKSB7XG4gICAgICAgIHZhciByZWY7XG4gICAgICAgIHN3aXRjaCAoc2VsZWN0b3IpIHtcbiAgICAgICAgICBjYXNlICdjb2RlcG9pbnRzJzpcbiAgICAgICAgICAgIHJldHVybiAoQXJyYXkuZnJvbSh4KSkubGVuZ3RoO1xuICAgICAgICAgIGNhc2UgJ2NvZGV1bml0cyc6XG4gICAgICAgICAgICByZXR1cm4geC5sZW5ndGg7XG4gICAgICAgICAgY2FzZSAnYnl0ZXMnOlxuICAgICAgICAgICAgcmV0dXJuIEJ1ZmZlci5ieXRlTGVuZ3RoKHgsIChyZWYgPSB0eXBlb2Ygc2V0dGluZ3MgIT09IFwidW5kZWZpbmVkXCIgJiYgc2V0dGluZ3MgIT09IG51bGwgPyBzZXR0aW5nc1snZW5jb2RpbmcnXSA6IHZvaWQgMCkgIT0gbnVsbCA/IHJlZiA6ICd1dGYtOCcpO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHVua25vd24gY291bnRpbmcgc2VsZWN0b3IgJHtycHIoc2VsZWN0b3IpfWApO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2xpc3Rfb2YnLCB7XG4gICAgICB0ZXN0czoge1xuICAgICAgICBcInggaXMgYSBsaXN0XCI6ICh0eXBlLCB4LCAuLi54UCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmlzYS5saXN0KHgpO1xuICAgICAgICB9LFxuICAgICAgICAvKiBUQUlOVCBzaG91bGQgY2hlY2sgZm9yIGBAaXNhLnR5cGUgdHlwZWAgKi9cbiAgICAgICAgXCJ0eXBlIGlzIG5vbmVtcHR5X3RleHRcIjogKHR5cGUsIHgsIC4uLnhQKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNhLm5vbmVtcHR5X3RleHQodHlwZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFwiYWxsIGVsZW1lbnRzIHBhc3MgdGVzdFwiOiAodHlwZSwgeCwgLi4ueFApID0+IHtcbiAgICAgICAgICByZXR1cm4geC5ldmVyeSgoeHgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzYSh0eXBlLCB4eCwgLi4ueFApO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ29iamVjdF9vZicsIHtcbiAgICAgIHRlc3RzOiB7XG4gICAgICAgIFwieCBpcyBhIG9iamVjdFwiOiAodHlwZSwgeCwgLi4ueFApID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc2Eub2JqZWN0KHgpO1xuICAgICAgICB9LFxuICAgICAgICAvKiBUQUlOVCBzaG91bGQgY2hlY2sgZm9yIGBAaXNhLnR5cGUgdHlwZWAgKi9cbiAgICAgICAgXCJ0eXBlIGlzIG5vbmVtcHR5X3RleHRcIjogKHR5cGUsIHgsIC4uLnhQKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNhLm5vbmVtcHR5X3RleHQodHlwZSk7XG4gICAgICAgIH0sXG4gICAgICAgIFwiYWxsIGVsZW1lbnRzIHBhc3MgdGVzdFwiOiAodHlwZSwgeCwgLi4ueFApID0+IHtcbiAgICAgICAgICB2YXIgXywgeHg7XG4gICAgICAgICAgZm9yIChfIGluIHgpIHtcbiAgICAgICAgICAgIHh4ID0geFtfXTtcbiAgICAgICAgICAgIGlmICghdGhpcy5pc2EodHlwZSwgeHgsIC4uLnhQKSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2pzaWRlbnRpZmllcicsIHtcbiAgICAgIHRlc3RzOiAoeCkgPT4ge1xuICAgICAgICByZXR1cm4gKHRoaXMuaXNhLnRleHQoeCkpICYmIGpzaWRlbnRpZmllcl9wYXR0ZXJuLnRlc3QoeCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ2ludDJ0ZXh0Jywge1xuICAgICAgdGVzdHM6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAodGhpcy5pc2EudGV4dCh4KSkgJiYgKCh4Lm1hdGNoKC9eWzAxXSskLykpICE9IG51bGwpO1xuICAgICAgfSxcbiAgICAgIGNhc3RzOiB7XG4gICAgICAgIGZsb2F0OiAoeCkgPT4ge1xuICAgICAgICAgIHJldHVybiBwYXJzZUludCh4LCAyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdGhpcy5kZWNsYXJlKCdpbnQxMHRleHQnLCB7XG4gICAgICB0ZXN0czogKHgpID0+IHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmlzYS50ZXh0KHgpKSAmJiAoKHgubWF0Y2goL15bMC05XSskLykpICE9IG51bGwpO1xuICAgICAgfSxcbiAgICAgIGNhc3RzOiB7XG4gICAgICAgIGZsb2F0OiAoeCkgPT4ge1xuICAgICAgICAgIHJldHVybiBwYXJzZUludCh4LCAxMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuZGVjbGFyZSgnaW50MTZ0ZXh0Jywge1xuICAgICAgdGVzdHM6ICh4KSA9PiB7XG4gICAgICAgIHJldHVybiAodGhpcy5pc2EudGV4dCh4KSkgJiYgKCh4Lm1hdGNoKC9eWzAtOWEtZkEtRl0rJC8pKSAhPSBudWxsKTtcbiAgICAgIH0sXG4gICAgICBjYXN0czoge1xuICAgICAgICBmbG9hdDogKHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoeCwgMTYpO1xuICAgICAgICB9LFxuICAgICAgICBpbnQydGV4dDogKHgpID0+IHtcbiAgICAgICAgICByZXR1cm4gKHBhcnNlSW50KHgsIDE2KSkudG9TdHJpbmcoMik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIHRoaXMuLyogVEFJTlQgY291bGQgdXNlIGBjYXN0KClgIEFQSSAqL2RlY2xhcmUoJ2ludDMyJywgZnVuY3Rpb24oeCkge1xuICAgICAgcmV0dXJuICh0aGlzLmlzYS5pbnRlZ2VyKHgpKSAmJiAoKC0yMTQ3NDgzNjQ4IDw9IHggJiYgeCA8PSAyMTQ3NDgzNjQ3KSk7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmUoJ3ZucicsIGZ1bmN0aW9uKHgpIHtcbiAgICAgIC8qIEEgdmVjdG9yaWFsIG51bWJlciAoVk5SKSBpcyBhIG5vbi1lbXB0eSBhcnJheSBvZiBudW1iZXJzLCBpbmNsdWRpbmcgaW5maW5pdHkuICovXG4gICAgICByZXR1cm4gKHRoaXMuaXNhX2xpc3Rfb2YuaW5mbG9hdCh4KSkgJiYgKHgubGVuZ3RoID4gMCk7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gdGhpcy5kZWNsYXJlKCdmc19zdGF0cycsIHtcbiAgICAgIHRlc3RzOiB7XG4gICAgICAgICd4IGlzIGFuIG9iamVjdCc6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc2Eub2JqZWN0KHgpO1xuICAgICAgICB9LFxuICAgICAgICAneC5zaXplIGlzIGEgY2FyZGluYWwnOiBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuaXNhLmNhcmRpbmFsKHguc2l6ZSk7XG4gICAgICAgIH0sXG4gICAgICAgICd4LmF0aW1lTXMgaXMgYSBmbG9hdCc6IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5pc2EuZmxvYXQoeC5hdGltZU1zKTtcbiAgICAgICAgfSxcbiAgICAgICAgJ3guYXRpbWUgaXMgYSBkYXRlJzogZnVuY3Rpb24oeCkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmlzYS5kYXRlKHguYXRpbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBUWVBFIERFQ0xBUkFUSU9OU1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuZGVjbGFyZV9jaGVja3MgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgRlMsIFBBVEg7XG4gICAgUEFUSCA9IHJlcXVpcmUoJ3BhdGgnKTtcbiAgICBGUyA9IHJlcXVpcmUoJ2ZzJyk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAvKiBOT1RFOiB3aWxsIHRocm93IGVycm9yIHVubGVzcyBwYXRoIGV4aXN0cywgZXJyb3IgaXMgaW1wbGljaXRseSBjYXVnaHQsIHJlcHJlc2VudHMgc2FkIHBhdGggKi9cbiAgICB0aGlzLmRlY2xhcmVfY2hlY2soJ2Zzb19leGlzdHMnLCBmdW5jdGlvbihwYXRoLCBzdGF0cyA9IG51bGwpIHtcbiAgICAgIHJldHVybiBGUy5zdGF0U3luYyhwYXRoKTtcbiAgICB9KTtcbiAgICAvLyB0cnkgKCBzdGF0cyA/IEZTLnN0YXRTeW5jIHBhdGggKSBjYXRjaCBlcnJvciB0aGVuIGVycm9yXG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICB0aGlzLmRlY2xhcmVfY2hlY2soJ2lzX2ZpbGUnLCBmdW5jdGlvbihwYXRoLCBzdGF0cyA9IG51bGwpIHtcbiAgICAgIHZhciBiYWQ7XG4gICAgICBpZiAodGhpcy5pc19zYWQoKGJhZCA9IHN0YXRzID0gdGhpcy5jaGVjay5mc29fZXhpc3RzKHBhdGgsIHN0YXRzKSkpKSB7XG4gICAgICAgIHJldHVybiBiYWQ7XG4gICAgICB9XG4gICAgICBpZiAoc3RhdHMuaXNGaWxlKCkpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuc2FkZGVuKGBub3QgYSBmaWxlOiAke3BhdGh9YCk7XG4gICAgfSk7XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gdGhpcy5kZWNsYXJlX2NoZWNrKCdpc19qc29uX2ZpbGUnLCBmdW5jdGlvbihwYXRoKSB7XG4gICAgICB2YXIgZXJyb3I7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShGUy5yZWFkRmlsZVN5bmMocGF0aCkpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IxKSB7XG4gICAgICAgIGVycm9yID0gZXJyb3IxO1xuICAgICAgICByZXR1cm4gZXJyb3I7XG4gICAgICB9XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gIy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuLy8gQGRlY2xhcmVfY2hlY2sgJ2VxdWFscycsICggYSwgUC4uLiApIC0+XG4vLyAgIGZvciBiIGluIFBcbi8vICAgICByZXR1cm4gQ0hFQ0tTLnNhZCB1bmxlc3MgZXF1YWxzIGEsIGJcbi8vICAgcmV0dXJuIHRydWVcbi8qIG5vdCBzdXBwb3J0ZWQgdW50aWwgd2UgZmlndXJlIG91dCBob3cgdG8gZG8gaXQgaW4gc3RyaWN0IG1vZGU6ICovXG4vLyBAZGVjbGFyZSAnYXJndW1lbnRzJywgICAgICAgICAgICAgICAgICAgICAoIHggKSAtPiAoIGpzX3R5cGVfb2YgeCApIGlzICdhcmd1bWVudHMnXG5cbiAgLy8gQXJyYXkuaXNBcnJheVxuLy8gQXJyYXlCdWZmZXIuaXNWaWV3XG4vLyBBdG9taWNzLmlzTG9ja0ZyZWVcbi8vIEJ1ZmZlci5pc0J1ZmZlclxuLy8gQnVmZmVyLmlzRW5jb2Rpbmdcbi8vIGNvbnN0cnVjdG9yLmlzXG4vLyBjb25zdHJ1Y3Rvci5pc0V4dGVuc2libGVcbi8vIGNvbnN0cnVjdG9yLmlzRnJvemVuXG4vLyBjb25zdHJ1Y3Rvci5pc1NlYWxlZFxuLy8gTnVtYmVyLmlzRmluaXRlXG4vLyBOdW1iZXIuaXNJbnRlZ2VyXG4vLyBOdW1iZXIuaXNOYU5cbi8vIE51bWJlci5pc1NhZmVJbnRlZ2VyXG4vLyBPYmplY3QuaXNcbi8vIE9iamVjdC5pc0V4dGVuc2libGVcbi8vIE9iamVjdC5pc0Zyb3plblxuLy8gT2JqZWN0LmlzU2VhbGVkXG4vLyBSZWZsZWN0LmlzRXh0ZW5zaWJsZVxuLy8gcm9vdC5pc0Zpbml0ZVxuLy8gcm9vdC5pc05hTlxuLy8gU3ltYm9sLmlzQ29uY2F0U3ByZWFkYWJsZVxuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1kZWNsYXJhdGlvbnMuanMubWFwIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBhc3NpZ24sIGNvbnN0cnVjdG9yX29mX2dlbmVyYXRvcnMsIGNvcHlfaWZfb3JpZ2luYWwsIGlzYV9jb3B5LCBqciwganNfdHlwZV9vZiwgcnByLCB4cnByLFxuICAgIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG4gIC8vIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcbiAgKHthc3NpZ24sIGpyLCBycHIsIHhycHIsIGpzX3R5cGVfb2Z9ID0gcmVxdWlyZSgnLi9oZWxwZXJzJykpO1xuXG4gIGlzYV9jb3B5ID0gU3ltYm9sKCdpc2FfY29weScpO1xuXG4gIGNvbnN0cnVjdG9yX29mX2dlbmVyYXRvcnMgPSAoKGZ1bmN0aW9uKigpIHtcbiAgICByZXR1cm4gKHlpZWxkIDQyKTtcbiAgfSkoKSkuY29uc3RydWN0b3I7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvKiBUQUlOVCBtYWtlIGNhdGFsb2cgb2YgYWxsICdkZWVwIEpTJyBuYW1lcyB0aGF0IG11c3QgbmV2ZXIgYmUgdXNlZCBhcyB0eXBlcywgYi9jIGUuZyBhIHR5cGUgJ2JpbmQnXG4gIHdvdWxkIHNoYWRvdyBuYXRpdmUgYGYuYmluZCgpYCAqL1xuICB0aGlzLmlsbGVnYWxfdHlwZXMgPSBbJ2JpbmQnLCAndG9TdHJpbmcnLCAndmFsdWVPZiddO1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY29weV9pZl9vcmlnaW5hbCA9IGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgUjtcbiAgICBpZiAoeFtpc2FfY29weV0pIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBSID0gYXNzaWduKHt9LCB4KTtcbiAgICBSW2lzYV9jb3B5XSA9IHRydWU7XG4gICAgcmV0dXJuIFI7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLl9zYXRpc2ZpZXNfYWxsX2FzcGVjdHMgPSBmdW5jdGlvbih0eXBlLCAuLi54UCkge1xuICAgIGlmICgodGhpcy5fZ2V0X3Vuc2F0aXNmaWVkX2FzcGVjdCh0eXBlLCAuLi54UCkpID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLl9nZXRfdW5zYXRpc2ZpZWRfYXNwZWN0ID0gZnVuY3Rpb24odHlwZSwgLi4ueFApIHtcbiAgICB2YXIgYXNwZWN0LCBmYWN0dWFsX3R5cGUsIHJlZiwgc3BlYywgdGVzdDtcbiAgICAvKiBDaGVjayB3aXRoIGB0eXBlX29mKClgIGlmIHR5cGUgbm90IGluIHNwZWM6ICovXG4gICAgaWYgKChzcGVjID0gdGhpcy5zcGVjc1t0eXBlXSkgPT0gbnVsbCkge1xuICAgICAgaWYgKChmYWN0dWFsX3R5cGUgPSB0aGlzLnR5cGVfb2YoLi4ueFApKSA9PT0gdHlwZSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBgJHtycHIodHlwZSl9IGlzIGEga25vd24gdHlwZWA7XG4gICAgfVxuICAgIHJlZiA9IHNwZWMudGVzdHM7XG4gICAgLyogQ2hlY2sgYWxsIGNvbnN0cmFpbnRzIGluIHNwZWM6ICovXG4gICAgZm9yIChhc3BlY3QgaW4gcmVmKSB7XG4gICAgICB0ZXN0ID0gcmVmW2FzcGVjdF07XG4gICAgICBpZiAoIXRlc3QuYXBwbHkodGhpcywgeFApKSB7XG4gICAgICAgIHJldHVybiBhc3BlY3Q7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy50eXBlX29mID0gZnVuY3Rpb24oeCkge1xuICAgIHZhciBSLCBhcml0eSwgYywgdGFnbmFtZTtcbiAgICBpZiAoKGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aCkgIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgXjc3NDZeIGV4cGVjdGVkIDEgYXJndW1lbnQsIGdvdCAke2FyaXR5fWApO1xuICAgIH1cbiAgICBpZiAoeCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuICdudWxsJztcbiAgICB9XG4gICAgaWYgKHggPT09IHZvaWQgMCkge1xuICAgICAgcmV0dXJuICd1bmRlZmluZWQnO1xuICAgIH1cbiAgICBpZiAoKHggPT09IDJlMzA4KSB8fCAoeCA9PT0gLTJlMzA4KSkge1xuICAgICAgcmV0dXJuICdpbmZpbml0eSc7XG4gICAgfVxuICAgIGlmICgoeCA9PT0gdHJ1ZSkgfHwgKHggPT09IGZhbHNlKSkge1xuICAgICAgcmV0dXJuICdib29sZWFuJztcbiAgICB9XG4gICAgaWYgKE51bWJlci5pc05hTih4KSkge1xuICAgICAgcmV0dXJuICduYW4nO1xuICAgIH1cbiAgICBpZiAoQnVmZmVyLmlzQnVmZmVyKHgpKSB7XG4gICAgICByZXR1cm4gJ2J1ZmZlcic7XG4gICAgfVxuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgKCgodGFnbmFtZSA9IHhbU3ltYm9sLnRvU3RyaW5nVGFnXSkgIT0gbnVsbCkgJiYgKHR5cGVvZiB0YWduYW1lKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIGlmICh0YWduYW1lID09PSAnQXJyYXkgSXRlcmF0b3InKSB7XG4gICAgICAgIHJldHVybiAnYXJyYXlpdGVyYXRvcic7XG4gICAgICB9XG4gICAgICBpZiAodGFnbmFtZSA9PT0gJ1N0cmluZyBJdGVyYXRvcicpIHtcbiAgICAgICAgcmV0dXJuICdzdHJpbmdpdGVyYXRvcic7XG4gICAgICB9XG4gICAgICBpZiAodGFnbmFtZSA9PT0gJ01hcCBJdGVyYXRvcicpIHtcbiAgICAgICAgcmV0dXJuICdtYXBpdGVyYXRvcic7XG4gICAgICB9XG4gICAgICBpZiAodGFnbmFtZSA9PT0gJ1NldCBJdGVyYXRvcicpIHtcbiAgICAgICAgcmV0dXJuICdzZXRpdGVyYXRvcic7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGFnbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgICBpZiAoKGMgPSB4LmNvbnN0cnVjdG9yKSA9PT0gdm9pZCAwKSB7XG4gICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgLyogRG9tZW5pYyBEZW5pY29sYSBEZXZpY2UsIHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvMzA1NjA1ODEgKi9cbiAgICAgIHJldHVybiAnbnVsbG9iamVjdCc7XG4gICAgfVxuICAgIGlmICgodHlwZW9mIGMpICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gJ29iamVjdCc7XG4gICAgfVxuICAgIGlmICgoUiA9IGMubmFtZS50b0xvd2VyQ2FzZSgpKSA9PT0gJycpIHtcbiAgICAgIGlmICh4LmNvbnN0cnVjdG9yID09PSBjb25zdHJ1Y3Rvcl9vZl9nZW5lcmF0b3JzKSB7XG4gICAgICAgIHJldHVybiAnZ2VuZXJhdG9yJztcbiAgICAgIH1cbiAgICAgIC8qIE5PVEU6IHRocm93IGVycm9yIHNpbmNlIHRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbiAqL1xuICAgICAgcmV0dXJuICgoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpKS5zbGljZSg4LCAtMSkpLnRvTG93ZXJDYXNlKCk7XG4gICAgfVxuICAgIGlmICgodHlwZW9mIHggPT09ICdvYmplY3QnKSAmJiAoUiA9PT0gJ2Jvb2xlYW4nIHx8IFIgPT09ICdudW1iZXInIHx8IFIgPT09ICdzdHJpbmcnKSkge1xuLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbi8qIE1hcmsgTWlsbGVyIERldmljZSAqLyAgICAgIHJldHVybiAnd3JhcHBlcic7XG4gICAgfVxuICAgIGlmIChSID09PSAnbnVtYmVyJykge1xuICAgICAgcmV0dXJuICdmbG9hdCc7XG4gICAgfVxuICAgIGlmIChSID09PSAncmVnZXhwJykge1xuICAgICAgcmV0dXJuICdyZWdleCc7XG4gICAgfVxuICAgIGlmIChSID09PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuICd0ZXh0JztcbiAgICB9XG4gICAgaWYgKFIgPT09ICdhcnJheScpIHtcbiAgICAgIHJldHVybiAnbGlzdCc7XG4gICAgfVxuICAgIGlmIChSID09PSAnZnVuY3Rpb24nICYmIHgudG9TdHJpbmcoKS5zdGFydHNXaXRoKCdjbGFzcyAnKSkge1xuICAgICAgLyogdGh4IHRvIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8yOTA5NDIwOSAqL1xuICAgICAgLyogVEFJTlQgbWF5IHByb2R1Y2UgYW4gYXJiaXRyYXJpbHkgbG9uZyB0aHJvd2F3YXkgc3RyaW5nICovXG4gICAgICByZXR1cm4gJ2NsYXNzJztcbiAgICB9XG4gICAgcmV0dXJuIFI7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLnR5cGVzX29mID0gZnVuY3Rpb24oLi4ueFApIHtcbiAgICB2YXIgUiwgYXNwZWN0LCBvaywgcmVmLCByZWYxLCBzcGVjLCB0ZXN0LCB0eXBlO1xuICAgIFIgPSBbXTtcbiAgICByZWYgPSB0aGlzLnNwZWNzO1xuICAgIGZvciAodHlwZSBpbiByZWYpIHtcbiAgICAgIHNwZWMgPSByZWZbdHlwZV07XG4gICAgICBvayA9IHRydWU7XG4gICAgICByZWYxID0gc3BlYy50ZXN0cztcbiAgICAgIGZvciAoYXNwZWN0IGluIHJlZjEpIHtcbiAgICAgICAgdGVzdCA9IHJlZjFbYXNwZWN0XTtcbiAgICAgICAgaWYgKCF0ZXN0LmFwcGx5KHRoaXMsIHhQKSkge1xuICAgICAgICAgIG9rID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChvaykge1xuICAgICAgICBSLnB1c2godHlwZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBSO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5kZWNsYXJlID0gZnVuY3Rpb24oLi4uUCkvKiB0eXBlLCBzcGVjPywgdGVzdD8gKi8ge1xuICAgIHZhciBhcml0eTtcbiAgICBzd2l0Y2ggKGFyaXR5ID0gUC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2xhcmVfMSguLi5QKTtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2xhcmVfMiguLi5QKTtcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RlY2xhcmVfMyguLi5QKTtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEVycm9yKGDCtTY3NDYgZXhwZWN0ZWQgYmV0d2VlbiAxIGFuZCAzIGFyZ3VtZW50cywgZ290ICR7YXJpdHl9YCk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLl9kZWNsYXJlXzEgPSBmdW5jdGlvbihzcGVjKSB7XG4gICAgdmFyIFQ7XG4gICAgaWYgKChUID0ganNfdHlwZV9vZihzcGVjKSkgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1Njg2OSBleHBlY3RlZCBhbiBvYmplY3QgZm9yIHNwZWMsIGdvdCBhICR7VH1gKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiAoKFQgPSBqc190eXBlX29mKHNwZWMudHlwZSkpICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDCtTY5OTIgZXhwZWN0ZWQgYSB0ZXh0IGZvciBzcGVjLnR5cGUsIGdvdCBhICR7VH1gKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzd2l0Y2ggKChUID0ganNfdHlwZV9vZihzcGVjLnRlc3RzKSkpIHtcbiAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgc3BlYy50ZXN0cyA9IHtcbiAgICAgICAgICBtYWluOiBzcGVjLnRlc3RzXG4gICAgICAgIH07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnb2JqZWN0JzpcbiAgICAgICAgbnVsbDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1NzExNSBleHBlY3RlZCBhbiBvYmplY3QgZm9yIHNwZWMudGVzdHMsIGdvdCBhICR7VH1gKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICByZXR1cm4gdGhpcy5fZGVjbGFyZShzcGVjKTtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuX2RlY2xhcmVfMiA9IGZ1bmN0aW9uKHR5cGUsIHNwZWNfb3JfdGVzdCkge1xuICAgIHZhciBULCBzcGVjO1xuICAgIHN3aXRjaCAoVCA9IGpzX3R5cGVfb2Yoc3BlY19vcl90ZXN0KSkge1xuICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICBjYXNlICdmdW5jdGlvbic6XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWNsYXJlXzEoe1xuICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgdGVzdHM6IHtcbiAgICAgICAgICAgIG1haW46IHNwZWNfb3JfdGVzdFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgIGNhc2UgJ2FzeW5jZnVuY3Rpb24nOlxuICAgICAgICB0aHJvdyBcIsK1NzIzOCBhc3luY2hyb25vdXMgZnVuY3Rpb25zIG5vdCB5ZXQgc3VwcG9ydGVkXCI7XG4gICAgfVxuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgKFQgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1NzM2MSBleHBlY3RlZCBhbiBvYmplY3QsIGdvdCBhICR7VH0gZm9yIHNwZWNgKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiAoKHNwZWNfb3JfdGVzdC50eXBlICE9IG51bGwpICYmICghc3BlY19vcl90ZXN0LnR5cGUgPT09IHR5cGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1NzQ4NCB0eXBlIGRlY2xhcmF0aW9ucyAke3Jwcih0eXBlKX0gYW5kICR7cnByKHNwZWNfb3JfdGVzdC50eXBlKX0gZG8gbm90IG1hdGNoYCk7XG4gICAgfVxuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgc3BlYyA9IGNvcHlfaWZfb3JpZ2luYWwoc3BlY19vcl90ZXN0KTtcbiAgICBzcGVjLnR5cGUgPSB0eXBlO1xuICAgIHJldHVybiB0aGlzLl9kZWNsYXJlXzEoc3BlYyk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLl9kZWNsYXJlXzMgPSBmdW5jdGlvbih0eXBlLCBzcGVjLCB0ZXN0KSB7XG4gICAgdmFyIFQ7XG4gICAgaWYgKChUID0ganNfdHlwZV9vZihzcGVjKSkgIT09ICdvYmplY3QnKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1NzYwNyBleHBlY3RlZCBhbiBvYmplY3QsIGdvdCBhICR7VH0gZm9yIHNwZWNgKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiAoKFQgPSBqc190eXBlX29mKHRlc3QpKSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGDCtTc3MzAgZXhwZWN0ZWQgYSBmdW5jdGlvbiBmb3IgdGVzdCwgZ290IGEgJHtUfWApO1xuICAgIH1cbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmIChzcGVjLnRlc3RzICE9IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIsK1Nzg1MyBzcGVjIGNhbm5vdCBoYXZlIHRlc3RzIHdoZW4gdGVzdHMgYXJlIHBhc3NlZCBhcyBhcmd1bWVudFwiKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBzcGVjID0gY29weV9pZl9vcmlnaW5hbChzcGVjKTtcbiAgICBzcGVjLnRlc3RzID0ge1xuICAgICAgbWFpbjogdGVzdFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuX2RlY2xhcmVfMih0eXBlLCBzcGVjKTtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuX2RlY2xhcmUgPSBmdW5jdGlvbihzcGVjKSB7XG4gICAgdmFyIHR5cGU7XG4gICAgc3BlYyA9IGNvcHlfaWZfb3JpZ2luYWwoc3BlYyk7XG4gICAgZGVsZXRlIHNwZWNbaXNhX2NvcHldO1xuICAgICh7dHlwZX0gPSBzcGVjKTtcbiAgICBzcGVjLnR5cGUgPSB0eXBlO1xuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgaWYgKGluZGV4T2YuY2FsbCh0aGlzLmlsbGVnYWxfdHlwZXMsIHR5cGUpID49IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgwrU3OTc2ICR7cnByKHR5cGUpfSBpcyBub3QgYSBsZWdhbCB0eXBlIG5hbWVgKTtcbiAgICB9XG4gICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICBpZiAodGhpcy5zcGVjc1t0eXBlXSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1ODA5OSB0eXBlICR7cnByKHR5cGUpfSBhbHJlYWR5IGRlY2xhcmVkYCk7XG4gICAgfVxuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgdGhpcy5zcGVjc1t0eXBlXSA9IHNwZWM7XG4gICAgdGhpcy5pc2FbdHlwZV0gPSAoLi4uUCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuaXNhKHR5cGUsIC4uLlApO1xuICAgIH07XG4gICAgLy8gQHZhbGlkYXRlWyB0eXBlIF0gICAgPSAoIFAuLi4gKSA9PiBAdmFsaWRhdGUgdHlwZSwgUC4uLlxuICAgIHNwZWMuc2l6ZSA9IHRoaXMuX3NpemVvZl9tZXRob2RfZnJvbV9zcGVjKHR5cGUsIHNwZWMpO1xuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgcmV0dXJuIG51bGw7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRlY2xhcmluZy5qcy5tYXAiLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcbiAgdmFyIExPVVBFLCBpbnNwZWN0LCBycHIsXG4gICAgaW5kZXhPZiA9IFtdLmluZGV4T2Y7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAoe2luc3BlY3R9ID0gcmVxdWlyZSgndXRpbCcpKTtcblxuICB0aGlzLmFzc2lnbiA9IE9iamVjdC5hc3NpZ247XG5cbiAgLy8gQGpyICAgICAgICAgICA9IEpTT04uc3RyaW5naWZ5XG4gIExPVVBFID0gcmVxdWlyZSgnLi4vZGVwcy9sb3VwZS5qcycpO1xuXG4gIHRoaXMucnByID0gcnByID0gKHgpID0+IHtcbiAgICByZXR1cm4gTE9VUEUuaW5zcGVjdCh4LCB7XG4gICAgICBjdXN0b21JbnNwZWN0OiBmYWxzZVxuICAgIH0pO1xuICB9O1xuXG4gIHRoaXMueHJwciA9IGZ1bmN0aW9uKHgpIHtcbiAgICByZXR1cm4gKHJwcih4KSkuc2xpY2UoMCwgMTAyNSk7XG4gIH07XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBUWVBFX09GIEZMQVZPUlNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLmRvbWVuaWNfZGVuaWNvbGFfZGV2aWNlID0gKHgpID0+IHtcbiAgICB2YXIgcmVmLCByZWYxO1xuICAgIHJldHVybiAocmVmID0geCAhPSBudWxsID8gKHJlZjEgPSB4LmNvbnN0cnVjdG9yKSAhPSBudWxsID8gcmVmMS5uYW1lIDogdm9pZCAwIDogdm9pZCAwKSAhPSBudWxsID8gcmVmIDogJy4vLic7XG4gIH07XG5cbiAgdGhpcy5tYXJrX21pbGxlcl9kZXZpY2UgPSAoeCkgPT4ge1xuICAgIHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpKS5zbGljZSg4LCAtMSk7XG4gIH07XG5cbiAgdGhpcy5tYXJrX21pbGxlcl9kZXZpY2VfMiA9ICh4KSA9PiB7XG4gICAgcmV0dXJuICgoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHgpKS5zbGljZSg4LCAtMSkpLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgvXFxzKy9nLCAnJyk7XG4gIH07XG5cbiAgdGhpcy5qc190eXBlX29mID0gKHgpID0+IHtcbiAgICByZXR1cm4gKChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoeCkpLnNsaWNlKDgsIC0xKSkudG9Mb3dlckNhc2UoKS5yZXBsYWNlKC9cXHMrL2csICcnKTtcbiAgfTtcblxuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLmdldF9ycHJzX29mX3RwcnMgPSBmdW5jdGlvbih0cHJzKSB7XG4gICAgLyogYHRwcnM6IHRlc3QgcGFyYW1ldGVycywgaS5lLiBhZGRpdGlvbmFsIGFyZ3VtZW50cyB0byB0eXBlIHRlc3RlciwgYXMgaW4gYG11bHRpcGxlX29mIHgsIDRgICovXG4gICAgdmFyIHJwcl9vZl90cHJzLCBzcnByX29mX3RwcnM7XG4gICAgcnByX29mX3RwcnMgPSAoZnVuY3Rpb24oKSB7XG4gICAgICBzd2l0Y2ggKHRwcnMubGVuZ3RoKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICByZXR1cm4gYCR7cnByKHRwcnNbMF0pfWA7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgcmV0dXJuIGAke3Jwcih0cHJzKX1gO1xuICAgICAgfVxuICAgIH0pKCk7XG4gICAgc3Jwcl9vZl90cHJzID0gKGZ1bmN0aW9uKCkge1xuICAgICAgc3dpdGNoIChycHJfb2ZfdHBycy5sZW5ndGgpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICByZXR1cm4gJyAnICsgcnByX29mX3RwcnM7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgICByZXR1cm4ge3Jwcl9vZl90cHJzLCBzcnByX29mX3RwcnN9O1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5pbnRlcnNlY3Rpb25fb2YgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHg7XG4gICAgYSA9IFsuLi5hXS5zb3J0KCk7XG4gICAgYiA9IFsuLi5iXS5zb3J0KCk7XG4gICAgcmV0dXJuICgoZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaSwgbGVuLCByZXN1bHRzO1xuICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgZm9yIChpID0gMCwgbGVuID0gYS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB4ID0gYVtpXTtcbiAgICAgICAgaWYgKGluZGV4T2YuY2FsbChiLCB4KSA+PSAwKSB7XG4gICAgICAgICAgcmVzdWx0cy5wdXNoKHgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9KSgpKS5zb3J0KCk7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWhlbHBlcnMuanMubWFwIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBIRUxQRVJTLCBNdWx0aW1peCwgYXNzaWduLCBjYXN0LCBjaGVjaywgZGVjbGFyYXRpb25zLCBnZXRfcnByc19vZl90cHJzLCBpc2EsIGlzYV9saXN0X29mLCBpc2Ffb2JqZWN0X29mLCBpc2Ffb3B0aW9uYWwsIGprX2VxdWFscywganIsIGpzX3R5cGVfb2YsIHJwciwgc2FkLCB2YWxpZGF0ZSwgdmFsaWRhdGVfbGlzdF9vZiwgdmFsaWRhdGVfb2JqZWN0X29mLCB2YWxpZGF0ZV9vcHRpb25hbCwgeHJwcjtcblxuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gIE11bHRpbWl4ID0gcmVxdWlyZSgnbXVsdGltaXgnKTtcblxuICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIEhFTFBFUlMgPSByZXF1aXJlKCcuL2hlbHBlcnMnKTtcblxuICAoe2Fzc2lnbiwganIsIHJwciwgeHJwciwgZ2V0X3JwcnNfb2ZfdHBycywganNfdHlwZV9vZn0gPSBIRUxQRVJTKTtcblxuICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gIGRlY2xhcmF0aW9ucyA9IHJlcXVpcmUoJy4vZGVjbGFyYXRpb25zJyk7XG5cbiAgc2FkID0gKHJlcXVpcmUoJy4vY2hlY2tzJykpLnNhZDtcblxuICBqa19lcXVhbHMgPSByZXF1aXJlKCcuLi9kZXBzL2prcm9zby1lcXVhbHMnKTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIGlzYSA9IGZ1bmN0aW9uKHR5cGUsIC4uLnhQKSB7XG4gICAgcmV0dXJuIHRoaXMuX3NhdGlzZmllc19hbGxfYXNwZWN0cyh0eXBlLCAuLi54UCk7XG4gIH07XG5cbiAgaXNhX2xpc3Rfb2YgPSBmdW5jdGlvbih0eXBlLCAuLi54UCkge1xuICAgIHJldHVybiB0aGlzLmlzYS5saXN0X29mKHR5cGUsIC4uLnhQKTtcbiAgfTtcblxuICBpc2Ffb2JqZWN0X29mID0gZnVuY3Rpb24odHlwZSwgLi4ueFApIHtcbiAgICByZXR1cm4gdGhpcy5pc2Eub2JqZWN0X29mKHR5cGUsIC4uLnhQKTtcbiAgfTtcblxuICB2YWxpZGF0ZV9saXN0X29mID0gZnVuY3Rpb24odHlwZSwgLi4ueFApIHtcbiAgICByZXR1cm4gdGhpcy52YWxpZGF0ZS5saXN0X29mKHR5cGUsIC4uLnhQKTtcbiAgfTtcblxuICB2YWxpZGF0ZV9vYmplY3Rfb2YgPSBmdW5jdGlvbih0eXBlLCAuLi54UCkge1xuICAgIHJldHVybiB0aGlzLnZhbGlkYXRlLm9iamVjdF9vZih0eXBlLCAuLi54UCk7XG4gIH07XG5cbiAgaXNhX29wdGlvbmFsID0gZnVuY3Rpb24odHlwZSwgLi4ueFApIHtcbiAgICByZXR1cm4gKHhQWzBdID09IG51bGwpIHx8IHRoaXMuX3NhdGlzZmllc19hbGxfYXNwZWN0cyh0eXBlLCAuLi54UCk7XG4gIH07XG5cbiAgdmFsaWRhdGVfb3B0aW9uYWwgPSBmdW5jdGlvbih0eXBlLCAuLi54UCkge1xuICAgIHJldHVybiAoeFBbMF0gPT0gbnVsbCkgfHwgdGhpcy52YWxpZGF0ZSh0eXBlLCAuLi54UCk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBjYXN0ID0gZnVuY3Rpb24odHlwZV9hLCB0eXBlX2IsIHgsIC4uLnhQKSB7XG4gICAgdmFyIGNhc3RzLCBjb252ZXJ0ZXI7XG4gICAgdGhpcy52YWxpZGF0ZSh0eXBlX2EsIHgsIC4uLnhQKTtcbiAgICBpZiAodHlwZV9hID09PSB0eXBlX2IpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZiAodGhpcy5pc2EodHlwZV9iLCB4LCAuLi54UCkpIHtcbiAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBpZiAoKGNhc3RzID0gdGhpcy5zcGVjc1t0eXBlX2FdLmNhc3RzKSAhPSBudWxsKSB7XG4gICAgICBpZiAoKGNvbnZlcnRlciA9IGNhc3RzW3R5cGVfYl0pICE9IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGNvbnZlcnRlci5jYWxsKHRoaXMsIHgsIC4uLnhQKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHR5cGVfYiA9PT0gJ3RleHQnLyogVEFJTlQgdXNlIGJldHRlciBtZXRob2QgbGlrZSB1dGlsLmluc3BlY3QgKi8pIHtcbiAgICAgIHJldHVybiBgJHt4fWA7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihgXmludGVydHlwZS9jYXN0QDEyMzReIHVuYWJsZSB0byBjYXN0IGEgJHt0eXBlX2F9IGFzICR7dHlwZV9ifWApO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgY2hlY2sgPSBmdW5jdGlvbih0eXBlLCB4LCAuLi54UCkge1xuICAgIHZhciBlcnJvcjtcbiAgICBpZiAodGhpcy5zcGVjc1t0eXBlXSAhPSBudWxsKSB7XG4gICAgICBpZiAodGhpcy5pc2EodHlwZSwgeCwgLi4ueFApKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNhZDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChjaGVjayA9IHRoaXMuY2hlY2tzW3R5cGVdKSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYF5pbnRlcnR5cGUvY2hlY2tAMTM0NV4gdW5rbm93biB0eXBlIG9yIGNoZWNrICR7cnByKHR5cGUpfWApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGNoZWNrLmNhbGwodGhpcywgeCwgLi4ueFApO1xuICAgIH0gY2F0Y2ggKGVycm9yMSkge1xuICAgICAgZXJyb3IgPSBlcnJvcjE7XG4gICAgICByZXR1cm4gZXJyb3I7XG4gICAgfVxuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdmFsaWRhdGUgPSBmdW5jdGlvbih0eXBlLCAuLi54UCkge1xuICAgIHZhciBQLCBhc3BlY3QsIG1lc3NhZ2UsIHJwcl9vZl90cHJzLCBzcnByX29mX3RwcnMsIHg7XG4gICAgaWYgKChhc3BlY3QgPSB0aGlzLl9nZXRfdW5zYXRpc2ZpZWRfYXNwZWN0KHR5cGUsIC4uLnhQKSkgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIFt4LCAuLi5QXSA9IHhQO1xuICAgICh7cnByX29mX3RwcnMsIHNycHJfb2ZfdHByc30gPSBnZXRfcnByc19vZl90cHJzKFApKTtcbiAgICBtZXNzYWdlID0gYXNwZWN0ID09PSAnbWFpbicgPyBgXmludGVydHlwZS92YWxpZGF0ZUAxNDU2XiBub3QgYSB2YWxpZCAke3R5cGV9OiAke3hycHIoeCl9JHtzcnByX29mX3RwcnN9YCA6IGBeaW50ZXJ0eXBlL3ZhbGlkYXRlQDE1NjdeIG5vdCBhIHZhbGlkICR7dHlwZX0gKHZpb2xhdGVzICR7cnByKGFzcGVjdCl9KTogJHt4cnByKHgpfSR7c3Jwcl9vZl90cHJzfWA7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICB9O1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgdGhpcy5JbnRlcnR5cGUgPSAoZnVuY3Rpb24oKSB7XG4gICAgY2xhc3MgSW50ZXJ0eXBlIGV4dGVuZHMgTXVsdGltaXgge1xuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGNvbnN0cnVjdG9yKHRhcmdldCA9IG51bGwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIC8qIFRBSU5UIGJ1ZyBpbiBNdWx0aU1peCwgc2hvdWxkIGJlIHBvc3NpYmxlIHRvIGRlY2xhcmUgbWV0aG9kcyBpbiBjbGFzcywgbm90IHRoZSBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgYW5kIHN0aWxsIGdldCBhIGJvdW5kIHZlcnNpb24gd2l0aCBgZXhwb3J0KClgOyBkZWNsYXJpbmcgdGhlbSBoZXJlIEZUVEIgKi9cbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHRoaXMuc2FkID0gc2FkO1xuICAgICAgICB0aGlzLnNwZWNzID0ge307XG4gICAgICAgIHRoaXMuY2hlY2tzID0ge307XG4gICAgICAgIHRoaXMuaXNhID0gTXVsdGltaXguZ2V0X2tleW1ldGhvZF9wcm94eSh0aGlzLCBpc2EpO1xuICAgICAgICB0aGlzLmlzYV9vcHRpb25hbCA9IE11bHRpbWl4LmdldF9rZXltZXRob2RfcHJveHkodGhpcywgaXNhX29wdGlvbmFsKTtcbiAgICAgICAgdGhpcy5pc2FfbGlzdF9vZiA9IE11bHRpbWl4LmdldF9rZXltZXRob2RfcHJveHkodGhpcywgaXNhX2xpc3Rfb2YpO1xuICAgICAgICB0aGlzLmlzYV9vYmplY3Rfb2YgPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIGlzYV9vYmplY3Rfb2YpO1xuICAgICAgICB0aGlzLmNhc3QgPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIGNhc3QpO1xuICAgICAgICB0aGlzLnZhbGlkYXRlID0gTXVsdGltaXguZ2V0X2tleW1ldGhvZF9wcm94eSh0aGlzLCB2YWxpZGF0ZSk7XG4gICAgICAgIHRoaXMudmFsaWRhdGVfb3B0aW9uYWwgPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIHZhbGlkYXRlX29wdGlvbmFsKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZV9saXN0X29mID0gTXVsdGltaXguZ2V0X2tleW1ldGhvZF9wcm94eSh0aGlzLCB2YWxpZGF0ZV9saXN0X29mKTtcbiAgICAgICAgdGhpcy52YWxpZGF0ZV9vYmplY3Rfb2YgPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIHZhbGlkYXRlX29iamVjdF9vZik7XG4gICAgICAgIHRoaXMuY2hlY2sgPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIGNoZWNrKTtcbiAgICAgICAgdGhpcy5ub3dhaXQgPSBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgdGhpcy52YWxpZGF0ZS5pbW1lZGlhdGUoeCk7XG4gICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuX2hlbHBlcnMgPSBIRUxQRVJTO1xuICAgICAgICBkZWNsYXJhdGlvbnMuZGVjbGFyZV90eXBlcy5hcHBseSh0aGlzKTtcbiAgICAgICAgZGVjbGFyYXRpb25zLmRlY2xhcmVfY2hlY2tzLmFwcGx5KHRoaXMpO1xuICAgICAgICBpZiAodGFyZ2V0ICE9IG51bGwpIHtcbiAgICAgICAgICB0aGlzLmV4cG9ydCh0YXJnZXQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBlcXVhbHMoYSwgLi4uUCkge1xuICAgICAgICB2YXIgYXJpdHksIGIsIGksIGxlbiwgdHlwZV9vZl9hO1xuICAgICAgICBpZiAoKGFyaXR5ID0gYXJndW1lbnRzLmxlbmd0aCkgPCAyKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBeaW50ZXJ0eXBlL2VxdWFsc0AzNDg5XiBleHBlY3RlZCBhdCBsZWFzdCAyIGFyZ3VtZW50cywgZ290ICR7YXJpdHl9YCk7XG4gICAgICAgIH1cbiAgICAgICAgdHlwZV9vZl9hID0gdGhpcy50eXBlX29mKGEpO1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBQLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgYiA9IFBbaV07XG4gICAgICAgICAgaWYgKHR5cGVfb2ZfYSAhPT0gdGhpcy50eXBlX29mKGIpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgodHlwZV9vZl9hID09PSAnc2V0JyB8fCB0eXBlX29mX2EgPT09ICdtYXAnKSAmJiB0aGlzLmVxdWFscyhbLi4uYV0sIFsuLi5iXSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWprX2VxdWFscyhhLCBiKSkge1xuICAgICAgICAgICAgLyogVEFJTlQgdGhpcyBjYWxsIGludm9sdmVzIGl0cyBvd24gdHlwZWNoZWNraW5nIGNvZGUgYW5kIHRodXMgbWF5IG15c3RlcmlvdXNseSBmYWlsICovXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8vIEBleHRlbmQgICBvYmplY3Rfd2l0aF9jbGFzc19wcm9wZXJ0aWVzXG4gICAgSW50ZXJ0eXBlLmluY2x1ZGUocmVxdWlyZSgnLi9zaXppbmcnKSk7XG5cbiAgICBJbnRlcnR5cGUuaW5jbHVkZShyZXF1aXJlKCcuL2RlY2xhcmluZycpKTtcblxuICAgIEludGVydHlwZS5pbmNsdWRlKHJlcXVpcmUoJy4vY2hlY2tzJykpO1xuXG4gICAgcmV0dXJuIEludGVydHlwZTtcblxuICB9KS5jYWxsKHRoaXMpO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWluLmpzLm1hcCIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICB2YXIgYXNzaWduLCBqciwganNfdHlwZV9vZiwgeHJwcjtcblxuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gICh7YXNzaWduLCBqciwgeHJwciwganNfdHlwZV9vZn0gPSByZXF1aXJlKCcuL2hlbHBlcnMnKSk7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBPQkpFQ1QgU0laRVNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLl9zaXplb2ZfbWV0aG9kX2Zyb21fc3BlYyA9IGZ1bmN0aW9uKHR5cGUsIHNwZWMpIHtcbiAgICByZXR1cm4gKChzKSA9PiB7XG4gICAgICB2YXIgVDtcbiAgICAgIGlmIChzID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG4gICAgICBzd2l0Y2ggKFQgPSBqc190eXBlX29mKHMpKSB7XG4gICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHJldHVybiB4W3NdO1xuICAgICAgICAgIH07XG4gICAgICAgIGNhc2UgJ2Z1bmN0aW9uJzpcbiAgICAgICAgICByZXR1cm4gcy8qIFRBSU5UIGRpc2FsbG93cyBhc3luYyBmdW50aW9ucyAqLztcbiAgICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gcy8qIFRBSU5UIGFsbG93cyBOYU4sIEluZmluaXR5ICovO1xuICAgICAgICAgIH07XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1MzA5ODggZXhwZWN0ZWQgbnVsbCwgYSB0ZXh0IG9yIGEgZnVuY3Rpb24gZm9yIHNpemUgb2YgJHt0eXBlfSwgZ290IGEgJHtUfWApO1xuICAgIH0pKHNwZWMuc2l6ZSk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLnNpemVfb2YgPSBmdW5jdGlvbih4LCAuLi5QKSB7XG4gICAgLyogVGhlIGBzaXplX29mKClgIG1ldGhvZCB1c2VzIGEgcGVyLXR5cGUgY29uZmlndXJhYmxlIG1ldGhvZG9sb2d5IHRvIHJldHVybiB0aGUgc2l6ZSBvZiBhIGdpdmVuIHZhbHVlO1xuICAgICBzdWNoIG1ldGhvZG9sb2d5IG1heSBwZXJtaXQgb3IgbmVjZXNzaXRhdGUgcGFzc2luZyBhZGRpdGlvbmFsIGFyZ3VtZW50cyAoc3VjaCBhcyBgc2l6ZV9vZiB0ZXh0YCwgd2hpY2hcbiAgICAgY29tZXMgaW4gc2V2ZXJhbCBmbGF2b3JzIGRlcGVuZGluZyBvbiB3aGV0aGVyIGJ5dGVzIG9yIGNvZGVwb2ludHMgYXJlIHRvIGJlIGNvdW50ZWQpLiBBcyBzdWNoLCBpdCBpcyBhXG4gICAgIG1vZGVsIGZvciBob3cgdG8gaW1wbGVtZW50IEdvLWxpa2UgbWV0aG9kIGRpc3BhdGNoaW5nLiAqL1xuICAgIHZhciBnZXR0ZXIsIHJlZiwgdHlwZTtcbiAgICB0eXBlID0gdGhpcy50eXBlX29mKHgpO1xuICAgIGlmICghKHRoaXMuaXNhLmZ1bmN0aW9uKChnZXR0ZXIgPSAocmVmID0gdGhpcy5zcGVjc1t0eXBlXSkgIT0gbnVsbCA/IHJlZi5zaXplIDogdm9pZCAwKSkpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYMK1ODg3OTMgdW5hYmxlIHRvIGdldCBzaXplIG9mIGEgJHt0eXBlfWApO1xuICAgIH1cbiAgICByZXR1cm4gZ2V0dGVyKHgsIC4uLlApO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLyogVEFJTlQgZmF1bHR5IGltcGxlbWVudGF0aW9uOlxuICAgKiBkb2VzIG5vdCB1c2Ugc2l6ZV9vZiBidXQgbGVuZ3RoXG4gICAqIGRvZXMgbm90IGFjY2VwdCBhZGRpdGlvbmFsIGFyZ3VtZW50cyBhcyBuZWVkZWQgZm9yIHRleHRzXG4gICAqIHJpc2tzIHRvIGJyZWFrIGNvZGVwb2ludHMgYXBhcnRcbiAgICAqL1xuICB0aGlzLmZpcnN0X29mID0gZnVuY3Rpb24oY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uWzBdO1xuICB9O1xuXG4gIHRoaXMubGFzdF9vZiA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbltjb2xsZWN0aW9uLmxlbmd0aCAtIDFdO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy5hcml0eV9vZiA9IGZ1bmN0aW9uKHgpIHtcbiAgICB2YXIgdHlwZTtcbiAgICBpZiAoKHR5cGUgPSB0aGlzLnN1cGVydHlwZV9vZih4KSkgIT09ICdjYWxsYWJsZScpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgwrU4ODczMyBleHBlY3RlZCBhIGNhbGxhYmxlLCBnb3QgYSAke3R5cGV9YCk7XG4gICAgfVxuICAgIHJldHVybiB4Lmxlbmd0aDtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuaGFzX3NpemUgPSBmdW5jdGlvbih4KSB7XG4gICAgdmFyIHJlZjtcbiAgICByZXR1cm4gdGhpcy5pc2EuZnVuY3Rpb24oKHJlZiA9IHRoaXMuc3BlY3NbdGhpcy50eXBlX29mKHgpXSkgIT0gbnVsbCA/IHJlZi5zaXplIDogdm9pZCAwKTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2l6aW5nLmpzLm1hcCIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gIC8vIE9CSkVDVCBQUk9QRVJUWSBDQVRBTE9HVUlOR1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMua2V5c19vZiA9IGZ1bmN0aW9uKC4uLlApIHtcbiAgICByZXR1cm4gdGhpcy52YWx1ZXNfb2YodGhpcy53YWxrX2tleXNfb2YoLi4uUCkpO1xuICB9O1xuXG4gIHRoaXMuYWxsX2tleXNfb2YgPSBmdW5jdGlvbiguLi5QKSB7XG4gICAgcmV0dXJuIHRoaXMudmFsdWVzX29mKHRoaXMud2Fsa19hbGxfa2V5c19vZiguLi5QKSk7XG4gIH07XG5cbiAgdGhpcy5hbGxfb3duX2tleXNfb2YgPSBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggIT0gbnVsbCkge1xuICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuICB9O1xuXG4gIHRoaXMud2Fsa19hbGxfb3duX2tleXNfb2YgPSBmdW5jdGlvbiooeCkge1xuICAgIHZhciBpLCBrLCBsZW4sIHJlZiwgcmVzdWx0cztcbiAgICByZWYgPSB0aGlzLmFsbF9vd25fa2V5c19vZih4KTtcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBrID0gcmVmW2ldO1xuICAgICAgcmVzdWx0cy5wdXNoKCh5aWVsZCBrKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHRzO1xuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgdGhpcy53YWxrX2tleXNfb2YgPSBmdW5jdGlvbiooeCwgc2V0dGluZ3MpIHtcbiAgICB2YXIgZGVmYXVsdHMsIGssIHJlc3VsdHM7XG4gICAgZGVmYXVsdHMgPSB7XG4gICAgICBza2lwX3VuZGVmaW5lZDogdHJ1ZVxuICAgIH07XG4gICAgc2V0dGluZ3MgPSB7Li4uZGVmYXVsdHMsIC4uLnNldHRpbmdzfTtcbiAgICByZXN1bHRzID0gW107XG4gICAgZm9yIChrIGluIHgpIHtcbiAgICAgIGlmICgoeFtrXSA9PT0gdm9pZCAwKSAmJiBzZXR0aW5ncy5za2lwX3VuZGVmaW5lZCkge1xuICAgICAgICAvKiBUQUlOVCBzaG91bGQgdXNlIHByb3BlcnR5IGRlc2NyaXB0b3JzIHRvIGF2b2lkIHBvc3NpYmxlIHNpZGUgZWZmZWN0cyAqL1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdHMucHVzaCgoeWllbGQgaykpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMud2Fsa19hbGxfa2V5c19vZiA9IGZ1bmN0aW9uKHgsIHNldHRpbmdzKSB7XG4gICAgdmFyIGRlZmF1bHRzO1xuICAgIGRlZmF1bHRzID0ge1xuICAgICAgc2tpcF9vYmplY3Q6IHRydWUsXG4gICAgICBza2lwX3VuZGVmaW5lZDogdHJ1ZVxuICAgIH07XG4gICAgc2V0dGluZ3MgPSB7Li4uZGVmYXVsdHMsIC4uLnNldHRpbmdzfTtcbiAgICByZXR1cm4gdGhpcy5fd2Fsa19hbGxfa2V5c19vZih4LCBuZXcgU2V0KCksIHNldHRpbmdzKTtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuX3dhbGtfYWxsX2tleXNfb2YgPSBmdW5jdGlvbiooeCwgc2Vlbiwgc2V0dGluZ3MpIHtcbiAgICAvKiBUQUlOVCBzaG91bGQgdXNlIHByb3BlcnR5IGRlc2NyaXB0b3JzIHRvIGF2b2lkIHBvc3NpYmxlIHNpZGUgZWZmZWN0cyAqL1xuICAgIC8qIFRBSU5UIHRyeWluZyB0byBhY2Nlc3MgYGFyZ3VtZW50c2AgY2F1c2VzIGVycm9yICovXG4gICAgdmFyIGVycm9yLCBrLCBwcm90bywgcmVmLCB2YWx1ZTtcbiAgICBpZiAoKCFzZXR0aW5ncy5za2lwX29iamVjdCkgJiYgeCA9PT0gT2JqZWN0LnByb3RvdHlwZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZWYgPSB0aGlzLndhbGtfYWxsX293bl9rZXlzX29mKHgpO1xuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgZm9yIChrIG9mIHJlZikge1xuICAgICAgaWYgKHNlZW4uaGFzKGspKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgc2Vlbi5hZGQoayk7XG4gICAgICB0cnkge1xuICAgICAgICB2YWx1ZSA9IHhba107XG4gICAgICB9IGNhdGNoIChlcnJvcjEpIHtcbiAgICAgICAgZXJyb3IgPSBlcnJvcjE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCh2YWx1ZSA9PT0gdm9pZCAwKSAmJiBzZXR0aW5ncy5za2lwX3VuZGVmaW5lZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzZXR0aW5ncy5zeW1ib2wgIT0gbnVsbCkge1xuICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdmFsdWVbc2V0dGluZ3Muc3ltYm9sXSkge1xuICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB5aWVsZCBrO1xuICAgIH1cbiAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgIGlmICgocHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoeCkpICE9IG51bGwpIHtcbiAgICAgIHJldHVybiAoeWllbGQqIHRoaXMuX3dhbGtfYWxsX2tleXNfb2YocHJvdG8sIHNlZW4sIHNldHRpbmdzKSk7XG4gICAgfVxuICB9O1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLyogVHVybiBpdGVyYXRvcnMgaW50byBsaXN0cywgY29weSBsaXN0czogKi9cbiAgdGhpcy52YWx1ZXNfb2YgPSBmdW5jdGlvbih4KSB7XG4gICAgcmV0dXJuIFsuLi54XTtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuaGFzX2tleXMgPSBmdW5jdGlvbih4LCAuLi5QKSB7XG4gICAgdmFyIGksIGtleSwgbGVuLCByZWY7XG4gICAgaWYgKHggPT0gbnVsbCkge1xuICAgICAgLyogT2JzZXJ2ZSB0aGF0IGBoYXNfa2V5cygpYCBhbHdheXMgY29uc2lkZXJzIGB1bmRlZmluZWRgIGFzICdub3Qgc2V0JyAqL1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbi8qIFRBSU5UIG9yIHRocm93IGVycm9yICovICAgIHJlZiA9IFAuZmxhdCgyZTMwOCk7XG4gICAgZm9yIChpID0gMCwgbGVuID0gcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICBrZXkgPSByZWZbaV07XG4gICAgICBpZiAoeFtrZXldID09PSB2b2lkIDApIHtcbiAgICAgICAgLyogVEFJTlQgc2hvdWxkIHVzZSBwcm9wZXJ0eSBkZXNjcmlwdG9ycyB0byBhdm9pZCBwb3NzaWJsZSBzaWRlIGVmZmVjdHMgKi9cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuaGFzX2tleSA9IGZ1bmN0aW9uKHgsIGtleSkge1xuICAgIHJldHVybiB0aGlzLmhhc19rZXlzKHgsIGtleSk7XG4gIH07XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICB0aGlzLmhhc19vbmx5X2tleXMgPSBmdW5jdGlvbih4LCAuLi5QKSB7XG4gICAgdmFyIGtleXMsIHByb2JlcztcbiAgICBwcm9iZXMgPSAoUC5mbGF0KDJlMzA4KSkuc29ydCgpO1xuICAgIGtleXMgPSAodGhpcy52YWx1ZXNfb2YodGhpcy5rZXlzX29mKHgpKSkuc29ydCgpO1xuICAgIHJldHVybiBwcm9iZXMubGVuZ3RoID0ga2V5cy5sZW5ndGggJiYgcHJvYmVzLmV2ZXJ5KGZ1bmN0aW9uKHgsIGlkeCkge1xuICAgICAgcmV0dXJuIHggPT09IGtleXNbaWR4XTtcbiAgICB9KTtcbiAgfTtcblxufSkuY2FsbCh0aGlzKTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2F0YWxvZ3VpbmcuanMubWFwIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBNdWx0aW1peCwgbW9kdWxlX2tleXdvcmRzLFxuICAgIGluZGV4T2YgPSBbXS5pbmRleE9mO1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgLy8gTU9EVUxFIE1FVEFDTEFTUyBwcm92aWRlcyBzdGF0aWMgbWV0aG9kcyBgQGV4dGVuZCgpYCwgYEBpbmNsdWRlKClgXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLyogVGhlIGxpdHRsZSBkYW5jZSBhcm91bmQgdGhlIG1vZHVsZV9rZXl3b3JkcyB2YXJpYWJsZSBpcyB0byBlbnN1cmUgd2UgaGF2ZSBjYWxsYmFjayBzdXBwb3J0IHdoZW4gbWl4aW5zXG4gIGV4dGVuZCBhIGNsYXNzLiBTZWUgaHR0cHM6Ly9hcmN0dXJvLmdpdGh1Yi5pby9saWJyYXJ5L2NvZmZlZXNjcmlwdC8wM19jbGFzc2VzLmh0bWwgKi9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBtb2R1bGVfa2V5d29yZHMgPSBbJ2V4dGVuZGVkJywgJ2luY2x1ZGVkJ107XG5cbiAgTXVsdGltaXggPSAoZnVuY3Rpb24oKSB7XG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIGNsYXNzIE11bHRpbWl4IHtcbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzdGF0aWMgZXh0ZW5kKG9iamVjdCwgc2V0dGluZ3MgPSBudWxsKSB7XG4gICAgICAgIHZhciBrZXksIHJlZiwgdmFsdWU7XG4gICAgICAgIHNldHRpbmdzID0gey4uLntcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZVxuICAgICAgICAgIH0sIC4uLihzZXR0aW5ncyAhPSBudWxsID8gc2V0dGluZ3MgOiBudWxsKX07XG4gICAgICAgIGZvciAoa2V5IGluIG9iamVjdCkge1xuICAgICAgICAgIHZhbHVlID0gb2JqZWN0W2tleV07XG4gICAgICAgICAgaWYgKCEoaW5kZXhPZi5jYWxsKG1vZHVsZV9rZXl3b3Jkcywga2V5KSA8IDApKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCghc2V0dGluZ3Mub3ZlcndyaXRlKSAmJiAoKHRoaXMucHJvdG90eXBlW2tleV0gIT0gbnVsbCkgfHwgKHRoaXNba2V5XSAhPSBudWxsKSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgXm11bHRpbWl4L2luY2x1ZGVANTY4NCBvdmVyd3JpdGUgc2V0IHRvIGZhbHNlIGJ1dCBuYW1lIGFscmVhZHkgc2V0OiAke0pTT04uc3RyaW5naWZ5KGtleSl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXNba2V5XSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgocmVmID0gb2JqZWN0LmV4dGVuZGVkKSAhPSBudWxsKSB7XG4gICAgICAgICAgcmVmLmFwcGx5KHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RhdGljIGluY2x1ZGUob2JqZWN0LCBzZXR0aW5ncyA9IG51bGwpIHtcbiAgICAgICAgdmFyIGtleSwgcmVmLCB2YWx1ZTtcbiAgICAgICAgc2V0dGluZ3MgPSB7Li4ue1xuICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlXG4gICAgICAgICAgfSwgLi4uKHNldHRpbmdzICE9IG51bGwgPyBzZXR0aW5ncyA6IG51bGwpfTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqZWN0KSB7XG4gICAgICAgICAgdmFsdWUgPSBvYmplY3Rba2V5XTtcbiAgICAgICAgICBpZiAoIShpbmRleE9mLmNhbGwobW9kdWxlX2tleXdvcmRzLCBrZXkpIDwgMCkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoKCFzZXR0aW5ncy5vdmVyd3JpdGUpICYmICgodGhpcy5wcm90b3R5cGVba2V5XSAhPSBudWxsKSB8fCAodGhpc1trZXldICE9IG51bGwpKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBebXVsdGltaXgvaW5jbHVkZUA1NjgzIG92ZXJ3cml0ZSBzZXQgdG8gZmFsc2UgYnV0IG5hbWUgYWxyZWFkeSBzZXQ6ICR7SlNPTi5zdHJpbmdpZnkoa2V5KX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQXNzaWduIHByb3BlcnRpZXMgdG8gdGhlIHByb3RvdHlwZVxuICAgICAgICAgIHRoaXMucHJvdG90eXBlW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHJlZiA9IG9iamVjdC5pbmNsdWRlZCkgIT0gbnVsbCkge1xuICAgICAgICAgIHJlZi5hcHBseSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGV4cG9ydCh0YXJnZXQgPSBudWxsKSB7XG4gICAgICAgIC8qIFJldHVybiBhbiBvYmplY3Qgd2l0aCBtZXRob2RzLCBib3VuZCB0byB0aGUgY3VycmVudCBpbnN0YW5jZS4gKi9cbiAgICAgICAgdmFyIFIsIGssIHJlZiwgcmVmMSwgdjtcbiAgICAgICAgUiA9IHRhcmdldCAhPSBudWxsID8gdGFyZ2V0IDoge307XG4gICAgICAgIHJlZiA9IChyZXF1aXJlKCcuL2NhdGFsb2d1aW5nJykpLndhbGtfYWxsX2tleXNfb2YodGhpcyk7XG4gICAgICAgIGZvciAoayBvZiByZWYpIHtcbiAgICAgICAgICB2ID0gdGhpc1trXTtcbiAgICAgICAgICBpZiAoKHYgIT0gbnVsbCA/IHYuYmluZCA6IHZvaWQgMCkgPT0gbnVsbCkge1xuICAgICAgICAgICAgUltrXSA9IHY7XG4gICAgICAgICAgfSBlbHNlIGlmICgocmVmMSA9IHZbTXVsdGltaXguaXNhX2tleW1ldGhvZF9wcm94eV0pICE9IG51bGwgPyByZWYxIDogZmFsc2UpIHtcbiAgICAgICAgICAgIFJba10gPSBNdWx0aW1peC5nZXRfa2V5bWV0aG9kX3Byb3h5KHRoaXMsIHYpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBSW2tdID0gdi5iaW5kKHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUjtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldF9teV9wcm90b3R5cGUoKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0UHJvdG90eXBlT2YoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRoaXMpKTtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIG5ldyguLi5QKSB7XG4gICAgICAgIHJldHVybiBuZXcgdGhpcy5jb25zdHJ1Y3RvciguLi5QKTtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEtFWU1FVEhPRCBGQUNUT1JZXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc3RhdGljIGdldF9rZXltZXRob2RfcHJveHkoYmluZF90YXJnZXQsIGYpIHtcbiAgICAgICAgdmFyIFI7XG4gICAgICAgIFIgPSBuZXcgUHJveHkoZi5iaW5kKGJpbmRfdGFyZ2V0KSwge1xuICAgICAgICAgIGdldDogZnVuY3Rpb24odGFyZ2V0LCBrZXkpIHtcbiAgICAgICAgICAgIGlmIChrZXkgPT09ICdiaW5kJykgeyAvLyAuLi4gb3RoZXIgcHJvcGVydGllcyAuLi5cbiAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCh0eXBlb2Yga2V5KSA9PT0gJ3N5bWJvbCcpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRhcmdldFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKC4uLnhQKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0YXJnZXQoa2V5LCAuLi54UCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFJbTXVsdGltaXguaXNhX2tleW1ldGhvZF9wcm94eV0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gUjtcbiAgICAgIH1cblxuICAgIH07XG5cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIEBqc190eXBlX29mID0gKCB4ICkgLT4gcmV0dXJuICggKCBPYmplY3Q6OnRvU3RyaW5nLmNhbGwgeCApLnNsaWNlIDgsIC0xICkudG9Mb3dlckNhc2UoKVxuICAgIE11bHRpbWl4LmlzYV9rZXltZXRob2RfcHJveHkgPSBTeW1ib2woJ3Byb3h5Jyk7XG5cbiAgICByZXR1cm4gTXVsdGltaXg7XG5cbiAgfSkuY2FsbCh0aGlzKTtcblxuICAvLyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXG4gIG1vZHVsZS5leHBvcnRzID0gTXVsdGltaXg7XG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haW4uanMubWFwIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG4gIHZhciBEb20sIElOVEVSVEVYVCwgVGV4dCwgZGVidWcsIGlzYSwgbG91cGUsIG1pc2ZpdCwgdHlwZXMsIHZhbGlkYXRlO1xuXG4gIGxvdXBlID0gcmVxdWlyZSgnLi4vbG91cGUuanMnKTtcblxuICBtaXNmaXQgPSBTeW1ib2woJ21pc2ZpdCcpO1xuXG4gIGRlYnVnID0gY29uc29sZS5kZWJ1ZztcblxuICAoe3R5cGVzLCBpc2EsIHZhbGlkYXRlfSA9IHJlcXVpcmUoJy4vdHlwZXMnKSk7XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBJTlRFUlRFWFQgPSB7XG4gICAgY2FtZWxpemU6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICAgIC8qIHRoeCB0byBodHRwczovL2dpdGh1Yi5jb20vbG9kYXNoL2xvZGFzaC9ibG9iL21hc3Rlci9jYW1lbENhc2UuanMgKi9cbiAgICAgIHZhciBpLCBpZHgsIHJlZiwgd29yZCwgd29yZHM7XG4gICAgICB3b3JkcyA9IHRleHQuc3BsaXQoJy0nKTtcbiAgICAgIGZvciAoaWR4ID0gaSA9IDEsIHJlZiA9IHdvcmRzLmxlbmd0aDsgaSA8IHJlZjsgaWR4ID0gaSArPSArMSkge1xuICAgICAgICB3b3JkID0gd29yZHNbaWR4XTtcbiAgICAgICAgaWYgKHdvcmQgPT09ICcnKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgd29yZHNbaWR4XSA9IHdvcmRbMF0udG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gd29yZHMuam9pbignJyk7XG4gICAgfVxuICB9O1xuXG4gIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFRleHQgPSBjbGFzcyBUZXh0IHtcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgIHJwcih4KSB7XG4gICAgICByZXR1cm4gbG91cGUuaW5zcGVjdCh4KTtcbiAgICB9XG5cbiAgICBfcGVuMSh4KSB7XG4gICAgICBpZiAoaXNhLnRleHQoeCkpIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5ycHIoeCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGVuKC4uLlApIHtcbiAgICAgIHJldHVybiAoUC5tYXAoKHgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BlbjEoeCk7XG4gICAgICB9KSkuam9pbignICcpO1xuICAgIH1cblxuICAgIHBlbl9lc2NhcGUoLi4uUCkge1xuICAgICAgcmV0dXJuIChQLm1hcCgoeCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fcGVuX2VzY2FwZTEoeCk7XG4gICAgICB9KSkuam9pbignICcpO1xuICAgIH1cblxuICAgIGxvZyguLi5QKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5sb2codGhpcy5wZW4oLi4uUCkpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX3Blbl9lc2NhcGUxKHgpIHtcbiAgICAgIGlmIChpc2EudGV4dCh4KSkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZXNjYXBlKHgpO1xuICAgICAgfVxuICAgICAgaWYgKGlzYS5lbGVtZW50KHgpKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lc2NhcGUoeC5vdXRlckhUTUwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucnByKHgpO1xuICAgIH1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgX2VzY2FwZSh4KSB7XG4gICAgICByZXR1cm4geC5yZXBsYWNlKC8mL2csICcmYW1wOycpLnJlcGxhY2UoLzwvZywgJyZsdDsnKS5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gICAgfVxuXG4gIH07XG5cbiAgRG9tID0gKGZ1bmN0aW9uKCkge1xuICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICBjbGFzcyBEb20geyAvLyBleHRlbmRzIE11bHRpbWl4XG4gICAgICAvKiBpbnNwaXJlZCBieSBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbVxuICAgICAgIGFuZCBodHRwczovL2Jsb2cuZ2Fyc3Rhc2lvLmNvbS95b3UtZG9udC1uZWVkLWpxdWVyeSAqL1xuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHJlYWR5KGYpIHtcbiAgICAgICAgLy8gdGh4IHRvIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS83MDUzMTk3Lzc1NjgwOTFcbiAgICAgICAgLy8gZnVuY3Rpb24gcihmKXsvaW4vLnRlc3QoZG9jdW1lbnQucmVhZHlTdGF0ZSk/c2V0VGltZW91dChyLDksZik6ZigpfVxuICAgICAgICB2YWxpZGF0ZS5mdW5jdGlvbihmKTtcbiAgICAgICAgaWYgKC9pbi8udGVzdChkb2N1bWVudC5yZWFkeVN0YXRlKSkge1xuICAgICAgICAgIHJldHVybiBzZXRUaW1lb3V0KCgoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZWFkeShmKTtcbiAgICAgICAgICB9KSwgOSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGYoKTtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIFdBUk5JTkdTLCBOT1RJRklDQVRJT05TXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgX25vdGlmeShtZXNzYWdlKSB7XG4gICAgICAgIHZhciBib2R5LCBpZCwgbWVzc2FnZV9ib3gsIG1lc3NhZ2VfcCwgc3R5bGU7XG4gICAgICAgIGlkID0gJ21zZ2J4NDk1NzMnO1xuICAgICAgICBtZXNzYWdlX2JveCA9IHRoaXMuc2VsZWN0KGAke2lkfWAsIG51bGwpO1xuICAgICAgICBpZiAobWVzc2FnZV9ib3ggPT09IG51bGwpIHtcbiAgICAgICAgICBib2R5ID0gdGhpcy5zZWxlY3QoJ2JvZHknLCBudWxsKTtcbiAgICAgICAgICAvKiBUQUlOVCBib2R5IGVsZW1lbnQgY2Fubm90IGJlIGZvdW5kIHdoZW4gbWV0aG9kIGlzIGNhbGxlZCBiZWZvcmUgZG9jdW1lbnQgcmVhZHksIGJ1dCB3ZSBjb3VsZCBzdGlsbFxuICAgICAgICAgICAgICAgY29uc3RydWN0IGVsZW1lbnQgaW1tZWRpYXRlbHksIGFwcGVuZCBpdCBvbiBkb2N1bWVudCByZWFkeSAqL1xuICAgICAgICAgIGlmIChib2R5ID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3R5bGUgPSBcImJhY2tncm91bmQ6IzE4MTcxZDtcIjtcbiAgICAgICAgICBzdHlsZSArPSBcInBvc2l0aW9uOmZpeGVkO1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwiYm90dG9tOjBtbTtcIjtcbiAgICAgICAgICBzdHlsZSArPSBcImJvcmRlcjoxbW0gZGFzaGVkICNlMmZmMDA7XCI7XG4gICAgICAgICAgc3R5bGUgKz0gXCJwYWRkaW5nLWxlZnQ6M21tO1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwicGFkZGluZy1yaWdodDozbW07XCI7XG4gICAgICAgICAgc3R5bGUgKz0gXCJwYWRkaW5nLWJvdHRvbTozbW07XCI7XG4gICAgICAgICAgc3R5bGUgKz0gXCJmb250LWZhbWlseTpzYW5zLXNlcmlmO1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwiZm9udC13ZWlnaHQ6Ym9sZCAhaW1wb3J0YW50O1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwiZm9udC1zaXplOjNtbTtcIjtcbiAgICAgICAgICBzdHlsZSArPSBcImNvbG9yOiNlMmZmMDA7XCI7XG4gICAgICAgICAgc3R5bGUgKz0gXCJ3aWR0aDoxMDAlO1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwibWF4LWhlaWdodDozMG1tO1wiO1xuICAgICAgICAgIHN0eWxlICs9IFwib3ZlcmZsb3cteTpzY3JvbGw7XCI7XG4gICAgICAgICAgbWVzc2FnZV9ib3ggPSB0aGlzLnBhcnNlX29uZShgPGRpdiBpZD0ke2lkfSBzdHlsZT0nJHtzdHlsZX0nPjwvZGl2PmApO1xuICAgICAgICAgIHRoaXMuYXBwZW5kKGJvZHksIG1lc3NhZ2VfYm94KTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlX3AgPSBcIjxwIHN0eWxlPSdwYWRkaW5nLXRvcDozbW07Jz5cIjtcbiAgICAgICAgbWVzc2FnZV9wICs9IFwi4pqg77iPJm5ic3A7PHN0cm9uZz5cIjtcbiAgICAgICAgbWVzc2FnZV9wICs9IMK1LlRFWFQucGVuX2VzY2FwZShtZXNzYWdlKTtcbiAgICAgICAgbWVzc2FnZV9wICs9IFwiPC9zdHJvbmc+PC9wPlwiO1xuICAgICAgICBtZXNzYWdlX3AgPSB0aGlzLnBhcnNlX29uZShtZXNzYWdlX3ApO1xuICAgICAgICB0aGlzLmluc2VydF9hc19sYXN0KG1lc3NhZ2VfYm94LCBtZXNzYWdlX3ApO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHdhcm4oLi4uUCkge1xuICAgICAgICAvKiBDb25zdHJ1Y3QgYSB0ZXh0IG1lc3NhZ2UgZm9yIGRpc3BsYXkgaW4gY29uc29sZSBhbmQgaW4gbm90aWZpY2F0aW9uIGJveCwgYWxvbmdzaWRlIHdpdGggYSBzdGFjayB0cmFjZVxuICAgICAgICAgICB0byBiZSBzaG93biBvbmx5IGluIHRoZSBjb25zb2xlLCBwcmVjZWQgYnkgdGhlIG9yaWdpbmFsIGFyZ3VtZW50cyBhcyBwYXNzZWQgaW50byB0aGlzIGZ1bmN0aW9uLFxuICAgICAgICAgICBtZWFuaW5nIHRoYXQgYW55IERPTSBlbGVtZW50cyB3aWxsIGJlIGV4cGFuZGFibGUgbGlua3MgdG8gdGhlaXIgdmlzaWJsZSByZXByZXNlbnRhdGlvbnMgb24gdGhlIEhUTUxcbiAgICAgICAgICAgcGFnZS4gKi9cbiAgICAgICAgdmFyIGVycm9yLCBtZXNzYWdlO1xuICAgICAgICBtZXNzYWdlID0gwrUuVEVYVC5wZW4oLi4uUCk7XG4gICAgICAgIGVycm9yID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICBjb25zb2xlLmdyb3VwQ29sbGFwc2VkKFBbMF0pO1xuICAgICAgICBjb25zb2xlLndhcm4oLi4uUCk7XG4gICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuX25vdGlmeShtZXNzYWdlKTtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIC8qIE5PVEUgYMK1LkRPTS5zZWxlY3QoKWAgdG8gYmUgZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBgwrUuRE9NLnNlbGVjdF9maXJzdCgpYCAqL1xuICAgICAgc2VsZWN0KHNlbGVjdG9yLCBmYWxsYmFjayA9IG1pc2ZpdCkge1xuICAgICAgICByZXR1cm4gdGhpcy5zZWxlY3RfZmlyc3QoZG9jdW1lbnQsIHNlbGVjdG9yLCBmYWxsYmFjayk7XG4gICAgICB9XG5cbiAgICAgIHNlbGVjdF9maXJzdChzZWxlY3RvciwgZmFsbGJhY2sgPSBtaXNmaXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0X2Zyb20oZG9jdW1lbnQsIHNlbGVjdG9yLCBmYWxsYmFjayk7XG4gICAgICB9XG5cbiAgICAgIHNlbGVjdF9hbGwoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0X2FsbF9mcm9tKGRvY3VtZW50LCBzZWxlY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvKiBOT1RFIGDCtS5ET00uc2VsZWN0X2Zyb20oKWAgdG8gYmUgZGVwcmVjYXRlZCBpbiBmYXZvciBvZiBgwrUuRE9NLnNlbGVjdF9maXJzdF9mcm9tKClgICovXG4gICAgICBzZWxlY3RfZnJvbShlbGVtZW50LCBzZWxlY3RvciwgZmFsbGJhY2sgPSBtaXNmaXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VsZWN0X2ZpcnN0X2Zyb20oZWxlbWVudCwgc2VsZWN0b3IsIGZhbGxiYWNrKTtcbiAgICAgIH1cblxuICAgICAgc2VsZWN0X2ZpcnN0X2Zyb20oZWxlbWVudCwgc2VsZWN0b3IsIGZhbGxiYWNrID0gbWlzZml0KSB7XG4gICAgICAgIHZhciBSO1xuICAgICAgICB2YWxpZGF0ZS5kZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgdmFsaWRhdGUubm9uZW1wdHlfdGV4dChzZWxlY3Rvcik7XG4gICAgICAgIGlmICgoUiA9IGVsZW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcikpID09IG51bGwpIHtcbiAgICAgICAgICBpZiAoZmFsbGJhY2sgPT09IG1pc2ZpdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBewrVET00vc2VsZWN0X2Zyb21ANzc1OF4gbm8gc3VjaCBlbGVtZW50OiAke8K1LlRFWFQucnByKHNlbGVjdG9yKX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGZhbGxiYWNrO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBSO1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgc2VsZWN0X2FsbF9mcm9tKGVsZW1lbnQsIHNlbGVjdG9yKSB7XG4gICAgICAgIHZhbGlkYXRlLmRlbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0KHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICB9XG5cbiAgICAgIC8vIEFycmF5LmZyb20gZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsIHNlbGVjdG9yXG5cbiAgICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIHNlbGVjdF9pZChpZCwgZmFsbGJhY2sgPSBtaXNmaXQpIHtcbiAgICAgICAgdmFyIFI7XG4gICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQoaWQpO1xuICAgICAgICBpZiAoKFIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpID09IG51bGwpIHtcbiAgICAgICAgICBpZiAoZmFsbGJhY2sgPT09IG1pc2ZpdCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBewrVET00vc2VsZWN0X2lkQDc3NTheIG5vIGVsZW1lbnQgd2l0aCBJRDogJHvCtS5URVhULnJwcihpZCl9YCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBmYWxsYmFjaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUjtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIG1hdGNoZXNfc2VsZWN0b3IoZWxlbWVudCwgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKCFpc2EuZnVuY3Rpb24oZWxlbWVudCAhPSBudWxsID8gZWxlbWVudC5tYXRjaGVzIDogdm9pZCAwKSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgXsK1RE9NL3NlbGVjdF9pZEA3NzU4MV4gZXhwZWN0ZWQgZWxlbWVudCB3aXRoIFxcYG1hdGNoKClcXGAgbWV0aG9kLCBnb3QgJHvCtS5URVhULnJwcihlbGVtZW50KX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZWxlbWVudC5tYXRjaGVzKHNlbGVjdG9yKTtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldChlbGVtZW50LCBuYW1lKSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIH1cblxuICAgICAgZ2V0X251bWVyaWMoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh0aGlzLmdldChlbGVtZW50LCBuYW1lKSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdoZW4gY2FsbGVkIHdpdGggdHdvIGFyZ3VtZW50cyBhcyBpbiBgc2V0IGRpdiwgJ2JhcidgLCB3aWxsIHNldCB2YWx1ZXMtbGVzcyBhdHRyaWJ1dGUgKGA8ZGl2IGJhcj5gKVxuICAgICAgc2V0KGVsZW1lbnQsIG5hbWUsIHZhbHVlID0gJycpIHtcbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldF9jbGFzc2VzKGVsZW1lbnQpIHtcbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2xhc3NMaXN0O1xuICAgICAgfVxuXG4gICAgICBhZGRfY2xhc3MoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuYWRkKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBoYXNfY2xhc3MoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMobmFtZSk7XG4gICAgICB9XG5cbiAgICAgIHJlbW92ZV9jbGFzcyhlbGVtZW50LCBuYW1lKSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XG4gICAgICB9XG5cbiAgICAgIHRvZ2dsZV9jbGFzcyhlbGVtZW50LCBuYW1lKSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUobmFtZSk7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzd2FwX2NsYXNzKGVsZW1lbnQsIG9sZF9uYW1lLCBuZXdfbmFtZSkge1xuICAgICAgICBlbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUob2xkX25hbWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jbGFzc0xpc3QuYWRkKG5ld19uYW1lKTtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGhpZGUoZWxlbWVudCkge1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgfVxuXG4gICAgICBzaG93KGVsZW1lbnQpIHtcbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgZ2V0X2xpdmVfc3R5bGVzKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICBnbG9iYWxUaGlzLmdldF9zdHlsZSA9ICggZWxlbWVudCwgcHNldWRvX3NlbGVjdG9yLCBhdHRyaWJ1dGVfbmFtZSApIC0+XG4gICAgICAgIHVubGVzcyBhdHRyaWJ1dGVfbmFtZT9cbiAgICAgICAgICBbIHBzZXVkb19zZWxlY3RvciwgYXR0cmlidXRlX25hbWUsIF0gPSBbIHVuZGVmaW5lZCwgcHNldWRvX3NlbGVjdG9yLCBdXG4gICAgICAgIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUgZWxlbWVudCwgcHNldWRvX3NlbGVjdG9yXG4gICAgICAgIHJldHVybiBzdHlsZS5nZXRQcm9wZXJ0eVZhbHVlIGF0dHJpYnV0ZV9uYW1lXG4gICAgICAqL1xuICAgICAgLyogVEFJTlQgYWxzbyB1c2UgcHNldWRvX3NlbGVjdG9yLCBzZWUgYWJvdmUgKi9cbiAgICAgIC8qIHZhbGlkYXRpb24gZG9uZSBieSBtZXRob2QgKi9cbiAgICAgIC8qIHZhbGlkYXRpb24gZG9uZSBieSBtZXRob2QgKi8gICAgICBnZXRfc3R5bGVfdmFsdWUoZWxlbWVudCwgbmFtZSkge1xuICAgICAgICByZXR1cm4gKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkpW25hbWVdO1xuICAgICAgfVxuXG4gICAgICBnZXRfbnVtZXJpY19zdHlsZV92YWx1ZShlbGVtZW50LCBuYW1lKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KChnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpKVtuYW1lXSk7XG4gICAgICB9XG5cbiAgICAgIC8qIHRoeCB0byBodHRwczovL2Rhdmlkd2Fsc2gubmFtZS9jc3MtdmFyaWFibGVzLWphdmFzY3JpcHQgKi9cbiAgICAgIGdldF9wcm9wX3ZhbHVlKGVsZW1lbnQsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIChnZXRDb21wdXRlZFN0eWxlKGVsZW1lbnQpKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBnZXRfbnVtZXJpY19wcm9wX3ZhbHVlKGVsZW1lbnQsIG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoKGdldENvbXB1dGVkU3R5bGUoZWxlbWVudCkpLmdldFByb3BlcnR5VmFsdWUobmFtZSkpO1xuICAgICAgfVxuXG4gICAgICAvKiB0aHggdG8gaHR0cHM6Ly9kYXZpZHdhbHNoLm5hbWUvY3NzLXZhcmlhYmxlcy1qYXZhc2NyaXB0ICovXG4gICAgICBnZXRfZ2xvYmFsX3Byb3BfdmFsdWUobmFtZSkge1xuICAgICAgICByZXR1cm4gKGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQpKS5nZXRQcm9wZXJ0eVZhbHVlKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICBnZXRfbnVtZXJpY19nbG9iYWxfcHJvcF92YWx1ZShuYW1lKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KChnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50KSkuZ2V0UHJvcGVydHlWYWx1ZShuYW1lKSk7XG4gICAgICB9XG5cbiAgICAgIHNldF9nbG9iYWxfcHJvcF92YWx1ZShuYW1lLCB2YWx1ZSkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgLy8gIy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICAvLyBzZXRfcHJvcF9kZWZhdWx0cyA9IC0+XG4gICAgICAvLyAgICMjIyBUaGVyZSBzaG91ZCBiZSBhIGJldHRlciB3YXkgdG8gaW5qZWN0IHN0eWxlcyAjIyNcbiAgICAgIC8vICAgcmV0dXJuIG51bGwgaWYgX3NldF9wcm9wX2RlZmF1bHRzXG4gICAgICAvLyAgICMgaGVhZF9kb20gPSDCtS5ET00uc2VsZWN0X2ZpcnN0ICdoZWFkJ1xuICAgICAgLy8gICAjIHN0eWxlX3R4dCA9IFwiXCJcIlxuICAgICAgLy8gICAjIDxzdHlsZT5cbiAgICAgIC8vICAgIyAgICoge1xuICAgICAgLy8gICAjICAgICBvdXRsaW5lOiAgICAgICAycHggc29saWQgeWVsbG93OyB9XG4gICAgICAvLyAgICMgICA8L3N0eWxlPlxuICAgICAgLy8gICAjIFwiXCJcIlxuICAgICAgLy8gICAjIGhlYWRfZG9tLmlubmVySFRNTCA9IHN0eWxlX3R4dCArIGhlYWRfZG9tLmlubmVySFRNTFxuICAgICAgLy8gICB0b3BoYXRfZG9tID0gwrUuRE9NLnNlbGVjdF9maXJzdCAnI3RvcGhhdCdcbiAgICAgIC8vICAgwrUuRE9NLmluc2VydF9iZWZvcmUgdG9waGF0X2RvbSwgwrUuRE9NLnBhcnNlX29uZSBcIlwiXCJcbiAgICAgIC8vICAgPHN0eWxlPlxuICAgICAgLy8gICAgICoge1xuICAgICAgLy8gICAgICAgb3V0bGluZTogICAgICAgMnB4IHNvbGlkIHllbGxvdzsgfVxuICAgICAgLy8gICAgIDpyb290IHtcbiAgICAgIC8vICAgICAgIC0taHN0bi1zbGlkZXItdHJhY2stYmdjb2xvcjogICAgbGltZTsgfVxuICAgICAgLy8gICAgIDwvc3R5bGU+XG4gICAgICAvLyAgIFwiXCJcIlxuICAgICAgLy8gICByZXR1cm4gbnVsbFxuXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBzZXRfc3R5bGVfcnVsZShlbGVtZW50LCBuYW1lLCB2YWx1ZSkge1xuICAgICAgICAvKiBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0VsZW1lbnRDU1NJbmxpbmVTdHlsZS9zdHlsZSAqL1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0KG5hbWUpO1xuICAgICAgICByZXR1cm4gZWxlbWVudC5zdHlsZVtJTlRFUlRFWFQuY2FtZWxpemUobmFtZSldID0gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBFTEVNRU5UIENSRUFUSU9OXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcGFyc2Vfb25lKGVsZW1lbnRfaHRtbCkge1xuICAgICAgICB2YXIgUiwgbGVuZ3RoO1xuICAgICAgICBSID0gdGhpcy5wYXJzZV9hbGwoZWxlbWVudF9odG1sKTtcbiAgICAgICAgaWYgKChsZW5ndGggPSBSLmxlbmd0aCkgIT09IDEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYF7CtURPTS9wYXJzZV9vbmVANzU1OF4gZXhwZWN0ZWQgSFRNTCBmb3IgMSBlbGVtZW50IGJ1dCBnb3QgJHtsZW5ndGh9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFJbMF07XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBwYXJzZV9hbGwoaHRtbCkge1xuICAgICAgICB2YXIgUjtcbiAgICAgICAgLyogVEFJTlQgcmV0dXJuIEFycmF5IG9yIEhUTUxDb2xsZWN0aW9uPyAqL1xuICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0KGh0bWwpO1xuICAgICAgICBSID0gZG9jdW1lbnQuaW1wbGVtZW50YXRpb24uY3JlYXRlSFRNTERvY3VtZW50KCk7XG4gICAgICAgIFIuYm9keS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICByZXR1cm4gUi5ib2R5LmNoaWxkcmVuO1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgbmV3X2VsZW1lbnQoeG5hbWUsIC4uLlApIHtcbiAgICAgICAgLyogVEFJTlQgYW5hbHl6ZSB4bmFtZSAoYSBsYSBgZGl2I2lkNDIuZm9vLmJhcmApIGFzIGRvbmUgaW4gSW50ZXJ0ZXh0LkN1cG9maHRtbCAqL1xuICAgICAgICAvKiBUQUlOVCBpbiBzb21lIGNhc2VzIHVzaW5nIGlubmVySFRNTCwgZG9jdW1lbnRGcmFnbWVudCBtYXkgYmUgYWR2YW50YWdlb3VzICovXG4gICAgICAgIHZhciBSLCBhdHRyaWJ1dGVzLCBpLCBrLCBsZW4sIHAsIHRleHQsIHY7XG4gICAgICAgIFIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHhuYW1lKTtcbiAgICAgICAgYXR0cmlidXRlcyA9IHt9O1xuICAgICAgICB0ZXh0ID0gbnVsbDtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gUC5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgIHAgPSBQW2ldO1xuICAgICAgICAgIGlmIChpc2EudGV4dChwKSkge1xuICAgICAgICAgICAgdGV4dCA9IHA7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXR0cmlidXRlcyA9IE9iamVjdC5hc3NpZ24oYXR0cmlidXRlcywgcCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRleHQgIT0gbnVsbCkge1xuICAgICAgICAgIC8qIFRBSU5UIGNoZWNrIHR5cGU/ICovICAgICAgICAgIFIudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICB9XG4gICAgICAgIGZvciAoayBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgdiA9IGF0dHJpYnV0ZXNba107XG4gICAgICAgICAgUi5zZXRBdHRyaWJ1dGUoaywgdik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFI7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBkZWVwX2NvcHkoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jbG9uZU5vZGUodHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBPVVRFUiwgSU5ORVIgSFRNTFxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGdldF9pbm5lcl9odG1sKGVsZW1lbnQpIHtcbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuaW5uZXJIVE1MO1xuICAgICAgfVxuXG4gICAgICBnZXRfb3V0ZXJfaHRtbChlbGVtZW50KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQoZWxlbWVudCk7XG4gICAgICAgIHJldHVybiBlbGVtZW50Lm91dGVySFRNTDtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIElOU0VSVElPTlxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIGluc2VydChwb3NpdGlvbiwgdGFyZ2V0LCB4KSB7XG4gICAgICAgIHN3aXRjaCAocG9zaXRpb24pIHtcbiAgICAgICAgICBjYXNlICdiZWZvcmUnOlxuICAgICAgICAgIGNhc2UgJ2JlZm9yZWJlZ2luJzpcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmluc2VydF9iZWZvcmUodGFyZ2V0LCB4KTtcbiAgICAgICAgICBjYXNlICdhc19maXJzdCc6XG4gICAgICAgICAgY2FzZSAnYWZ0ZXJiZWdpbic6XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5pbnNlcnRfYXNfZmlyc3QodGFyZ2V0LCB4KTtcbiAgICAgICAgICBjYXNlICdhc19sYXN0JzpcbiAgICAgICAgICBjYXNlICdiZWZvcmVlbmQnOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0X2FzX2xhc3QodGFyZ2V0LCB4KTtcbiAgICAgICAgICBjYXNlICdhZnRlcic6XG4gICAgICAgICAgY2FzZSAnYWZ0ZXJlbmQnOlxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuaW5zZXJ0X2FmdGVyKHRhcmdldCwgeCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBewrVET00vaW5zZXJ0QDc3NTheIG5vdCBhIHZhbGlkIHBvc2l0aW9uOiAke8K1LlRFWFQucnByKHBvc2l0aW9uKX1gKTtcbiAgICAgIH1cblxuICAgICAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAgIC8qIE5PVEUgcGVuZGluZyBwcmFjdGljYWwgY29uc2lkZXJhdGlvbnMgYW5kIGJlbmNobWFya3Mgd2Ugd2lsbCBwcm9iYWJseSByZW1vdmUgb25lIG9mIHRoZSB0d28gc2V0c1xuICAgICAgIG9mIGluc2VydGlvbiBtZXRob2RzICovXG4gICAgICBpbnNlcnRfYmVmb3JlKHRhcmdldCwgeCkge1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHJldHVybiB0YXJnZXQuaW5zZXJ0QWRqYWNlbnRFbGVtZW50KCdiZWZvcmViZWdpbicsIHgpO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnRfYXNfZmlyc3QodGFyZ2V0LCB4KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2FmdGVyYmVnaW4nLCB4KTtcbiAgICAgIH1cblxuICAgICAgaW5zZXJ0X2FzX2xhc3QodGFyZ2V0LCB4KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2JlZm9yZWVuZCcsIHgpO1xuICAgICAgfVxuXG4gICAgICBpbnNlcnRfYWZ0ZXIodGFyZ2V0LCB4KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5pbnNlcnRBZGphY2VudEVsZW1lbnQoJ2FmdGVyZW5kJywgeCk7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBiZWZvcmUodGFyZ2V0LCAuLi54KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5iZWZvcmUoLi4ueCk7XG4gICAgICB9XG5cbiAgICAgIHByZXBlbmQodGFyZ2V0LCAuLi54KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5wcmVwZW5kKC4uLngpO1xuICAgICAgfVxuXG4gICAgICBhcHBlbmQodGFyZ2V0LCAuLi54KSB7XG4gICAgICAgIHZhbGlkYXRlLmVsZW1lbnQodGFyZ2V0KTtcbiAgICAgICAgcmV0dXJuIHRhcmdldC5hcHBlbmQoLi4ueCk7XG4gICAgICB9XG5cbiAgICAgIGFmdGVyKHRhcmdldCwgLi4ueCkge1xuICAgICAgICB2YWxpZGF0ZS5lbGVtZW50KHRhcmdldCk7XG4gICAgICAgIHJldHVybiB0YXJnZXQuYWZ0ZXIoLi4ueCk7XG4gICAgICB9XG5cbiAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBSRU1PVkFMXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgcmVtb3ZlKGVsZW1lbnQpIHtcbiAgICAgICAgLyogc2VlIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNyZW1vdmUgKi9cbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChlbGVtZW50KTtcbiAgICAgIH1cblxuICAgICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAgIC8vIEdFT01FVFJZXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgLyogTk9URSBvYnNlcnZlIHRoYXQgYERPTS5nZXRfb2Zmc2V0X3RvcCgpYCBhbmQgYGVsZW1lbnQub2Zmc2V0VG9wYCBhcmUgdHdvIGRpZmZlcmVudCB0aGluZ3M7IHRlcm1pbm9sb2d5XG4gICAgICAgaXMgY29uZnVzaW5nIGhlcmUsIHNvIGNvbnNpZGVyIHJlbmFtaW5nIHRvIGF2b2lkIGBvZmZzZXRgIGFsdG9nZXRoZXIgKi9cbiAgICAgIGdldF9vZmZzZXRfdG9wKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmdldF9vZmZzZXQoZWxlbWVudCkpLnRvcDtcbiAgICAgIH1cblxuICAgICAgZ2V0X29mZnNldF9sZWZ0KGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuICh0aGlzLmdldF9vZmZzZXQoZWxlbWVudCkpLmxlZnQ7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBnZXRfb2Zmc2V0KGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIHJlY3RhbmdsZTtcbiAgICAgICAgLyogc2VlIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNvZmZzZXQgKi9cbiAgICAgICAgdmFsaWRhdGUuZWxlbWVudChlbGVtZW50KTtcbiAgICAgICAgcmVjdGFuZ2xlID0gZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IHJlY3RhbmdsZS50b3AgKyBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCxcbiAgICAgICAgICBsZWZ0OiByZWN0YW5nbGUubGVmdCArIGRvY3VtZW50LmJvZHkuc2Nyb2xsTGVmdFxuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgLyogc2VlIGh0dHA6Ly95b3VtaWdodG5vdG5lZWRqcXVlcnkuY29tLyNnZXRfd2lkdGggKi9cbiAgICAgIGdldF93aWR0aChlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldF9udW1lcmljX3N0eWxlX3ZhbHVlKGVsZW1lbnQsICd3aWR0aCcpO1xuICAgICAgfVxuXG4gICAgICBnZXRfaGVpZ2h0KGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0X251bWVyaWNfc3R5bGVfdmFsdWUoZWxlbWVudCwgJ2hlaWdodCcpO1xuICAgICAgfVxuXG4gICAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICAgLy8gRVZFTlRTXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgb24oZWxlbWVudCwgbmFtZSwgaGFuZGxlcikge1xuICAgICAgICAvKiBUQUlOVCBhZGQgb3B0aW9ucyAqL1xuICAgICAgICAvKiBzZWUgaHR0cDovL3lvdW1pZ2h0bm90bmVlZGpxdWVyeS5jb20vI29uLCBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jZGVsZWdhdGUgKi9cbiAgICAgICAgLyogQWxzbyBub3RlIHRoZSBhZGRpdGlvbiBvZiBhIGBwYXNzaXZlOiBmYWxzZWAgcGFyYW1ldGVyIChhcyBpbiBgaHRtbF9kb20uYWRkRXZlbnRMaXN0ZW5lciAnd2hlZWwnLCBmLFxuICAgICAgICAgICB7IHBhc3NpdmU6IGZhbHNlLCB9YCk7IHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNTU0NjE2MzIvMjU2MzYxOyBhcHBhcmVudGx5IGl0IGlzIGEgcmVjZW50bHlcbiAgICAgICAgICAgaW50cm9kdWNlZCBmZWF0dXJlIG9mIGJyb3dzZXIgZXZlbnQgcHJvY2Vzc2luZzsgc2VlIGFsc28gW0pRdWVyeSBpc3N1ZSAjMjg3MSAqQWRkIHN1cHBvcnQgZm9yIHBhc3NpdmVcbiAgICAgICAgICAgZXZlbnQgbGlzdGVuZXJzKl0oaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvaXNzdWVzLzI4NzEpLCBvcGVuIGFzIG9mIERlYyAyMDIwICovXG4gICAgICAgIHZhbGlkYXRlLmRlbGVtZW50KGVsZW1lbnQpO1xuICAgICAgICB2YWxpZGF0ZS5ub25lbXB0eV90ZXh0KG5hbWUpO1xuICAgICAgICB2YWxpZGF0ZS5mdW5jdGlvbihoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBlbWl0X2N1c3RvbV9ldmVudChuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgIC8vIHRoeCB0byBodHRwczovL3d3dy5qYXZhc2NyaXB0dHV0b3JpYWwubmV0L2phdmFzY3JpcHQtZG9tL2phdmFzY3JpcHQtY3VzdG9tLWV2ZW50cy9cbiAgICAgICAgLyogQWNjLiB0byBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnQvRXZlbnQsXG4gICAgICAgICAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9DdXN0b21FdmVudC9DdXN0b21FdmVudCwgYWxsb3dhYmxlIGZpZWxkcyBmb3IgYG9wdGlvbnNgXG4gICAgICAgICAgIGluY2x1ZGUgYGJ1YmJsZXNgLCBgY2FuY2VsYWJsZWAsIGBjb21wb3NlZGAsIGBkZXRhaWxgOyB0aGUgbGFzdCBvbmUgbWF5IGNvbnRhaW4gYXJiaXRyYXJ5IGRhdGEgYW5kIGNhblxuICAgICAgICAgICBiZSByZXRyaWV2ZWQgYXMgYGV2ZW50LmRldGFpbGAuICovXG4gICAgICAgIHZhbGlkYXRlLm5vbmVtcHR5X3RleHQobmFtZSk7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChuYW1lLCBvcHRpb25zKSk7XG4gICAgICB9XG5cbiAgICAgIC8vPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgICAvLyBEUkFHR0FCTEVTXG4gICAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgICAgbWFrZV9kcmFnZ2FibGUoZWxlbWVudCkge1xuICAgICAgICB2YXIgaWQsIG9uX2RyYWdfc3RhcnQsIG9uX2Ryb3A7XG4gICAgICAgIC8qIHRoeCB0byBodHRwOi8vanNmaWRkbGUubmV0L3JvYmVydGMva0t1cUgvXG4gICAgICAgICAgIGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS82MjM5ODgyLzc1NjgwOTEgKi9cbiAgICAgICAgdGhpcy5fYXR0YWNoX2RyYWdvdmVyKCk7XG4gICAgICAgIHRoaXMuX3Bydl9kcmFnZ2FibGVfaWQrKztcbiAgICAgICAgaWQgPSB0aGlzLl9wcnZfZHJhZ2dhYmxlX2lkO1xuICAgICAgICB0aGlzLnNldChlbGVtZW50LCAnZHJhZ2dhYmxlJywgdHJ1ZSk7XG4gICAgICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLlxuICAgICAgICB0aGlzLm9uKGVsZW1lbnQsICdkcmFnc3RhcnQnLCBvbl9kcmFnX3N0YXJ0ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgc3R5bGUsIHgsIHk7XG4gICAgICAgICAgc3R5bGUgPSDCtS5ET00uZ2V0X2xpdmVfc3R5bGVzKGV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgeCA9IChwYXJzZUludChzdHlsZS5sZWZ0LCAxMCkpIC0gZXZlbnQuY2xpZW50WDtcbiAgICAgICAgICB5ID0gKHBhcnNlSW50KHN0eWxlLnRvcCwgMTApKSAtIGV2ZW50LmNsaWVudFk7XG4gICAgICAgICAgcmV0dXJuIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKCdhcHBsaWNhdGlvbi9qc29uJywgSlNPTi5zdHJpbmdpZnkoe3gsIHksIGlkfSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgLy8uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgICAgIHRoaXMub24oZG9jdW1lbnQuYm9keSwgJ2Ryb3AnLCBvbl9kcm9wID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICB2YXIgbGVmdCwgdG9wLCB0cmFuc2ZlcjtcbiAgICAgICAgICB0cmFuc2ZlciA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YVRyYW5zZmVyLmdldERhdGEoJ2FwcGxpY2F0aW9uL2pzb24nKSk7XG4gICAgICAgICAgaWYgKGlkICE9PSB0cmFuc2Zlci5pZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZWZ0ID0gZXZlbnQuY2xpZW50WCArIHRyYW5zZmVyLnggKyAncHgnO1xuICAgICAgICAgIHRvcCA9IGV2ZW50LmNsaWVudFkgKyB0cmFuc2Zlci55ICsgJ3B4JztcbiAgICAgICAgICDCtS5ET00uc2V0X3N0eWxlX3J1bGUoZWxlbWVudCwgJ2xlZnQnLCBsZWZ0KTtcbiAgICAgICAgICDCtS5ET00uc2V0X3N0eWxlX3J1bGUoZWxlbWVudCwgJ3RvcCcsIHRvcCk7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgICAvLy4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgICBfYXR0YWNoX2RyYWdvdmVyKCkge1xuICAgICAgICB2YXIgb25fZHJhZ292ZXI7XG4gICAgICAgIC8qIFRBSU5UIEFwcGFyZW50bHkgbmVlZCBmb3IgY29ycmVjdCBkcmFnZ2luZyBiZWhhdmlvciwgYnV0IHdoYXQgaWYgd2Ugd2FudGVkIHRvIGhhbmRsZSB0aGlzIGV2ZW50PyAqL1xuICAgICAgICB0aGlzLm9uKGRvY3VtZW50LmJvZHksICdkcmFnb3ZlcicsIG9uX2RyYWdvdmVyID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX2F0dGFjaF9kcmFnb3ZlciA9IGZ1bmN0aW9uKCkge307XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuXG4gICAgfTtcblxuICAgIC8vLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uLi4uXG4gICAgRG9tLnByb3RvdHlwZS5fcHJ2X2RyYWdnYWJsZV9pZCA9IDA7XG5cbiAgICByZXR1cm4gRG9tO1xuXG4gIH0pLmNhbGwodGhpcyk7XG5cbiAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAvLyBNQUdJQ1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIHRoaXMuX21hZ2ljID0gU3ltYm9sLmZvcignwrVET00nKTtcblxuICB0aGlzLlRFWFQgPSBuZXcgVGV4dCgpO1xuXG4gIHRoaXMuRE9NID0gbmV3IERvbSgpO1xuXG4gIHRoaXMuTElORUZJTkRFUiA9IHJlcXVpcmUoJy4vbGluZWZpbmRlcicpO1xuXG4gIHRoaXMuS0IgPSBuZXcgKHJlcXVpcmUoJy4va2InKSkuS2IoKTtcblxuICAvLyBtb2R1bGUuZXhwb3J0cy5ycHIgICAgID89IG1vZHVsZS5leHBvcnRzLsK1LlRFWFQucnByLmJpbmQoIMK1LlRFWFQgKVxuLy8gbW9kdWxlLmV4cG9ydHMubG9nICAgICA/PSBtb2R1bGUuZXhwb3J0cy7CtS5URVhULmxvZy5iaW5kKCDCtS5URVhUIClcbi8qXG5cbmh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xMTc5ODgvNzU2ODA5MVxuXG5pbm5lckhUTUwgaXMgcmVtYXJrYWJseSBmYXN0LCBhbmQgaW4gbWFueSBjYXNlcyB5b3Ugd2lsbCBnZXQgdGhlIGJlc3QgcmVzdWx0cyBqdXN0IHNldHRpbmcgdGhhdCAoSSB3b3VsZFxuanVzdCB1c2UgYXBwZW5kKS5cblxuSG93ZXZlciwgaWYgdGhlcmUgaXMgbXVjaCBhbHJlYWR5IGluIFwibXlkaXZcIiB0aGVuIHlvdSBhcmUgZm9yY2luZyB0aGUgYnJvd3NlciB0byBwYXJzZSBhbmQgcmVuZGVyIGFsbCBvZlxudGhhdCBjb250ZW50IGFnYWluIChldmVyeXRoaW5nIHRoYXQgd2FzIHRoZXJlIGJlZm9yZSwgcGx1cyBhbGwgb2YgeW91ciBuZXcgY29udGVudCkuIFlvdSBjYW4gYXZvaWQgdGhpcyBieVxuYXBwZW5kaW5nIGEgZG9jdW1lbnQgZnJhZ21lbnQgb250byBcIm15ZGl2XCIgaW5zdGVhZDpcblxudmFyIGZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG5mcmFnLmlubmVySFRNTCA9IGh0bWw7XG4kKFwiI215ZGl2XCIpLmFwcGVuZChmcmFnKTtcbkluIHRoaXMgd2F5LCBvbmx5IHlvdXIgbmV3IGNvbnRlbnQgZ2V0cyBwYXJzZWQgKHVuYXZvaWRhYmxlKSBhbmQgdGhlIGV4aXN0aW5nIGNvbnRlbnQgZG9lcyBub3QuXG5cbkVESVQ6IE15IGJhZC4uLiBJJ3ZlIGRpc2NvdmVyZWQgdGhhdCBpbm5lckhUTUwgaXNuJ3Qgd2VsbCBzdXBwb3J0ZWQgb24gZG9jdW1lbnQgZnJhZ21lbnRzLiBZb3UgY2FuIHVzZSB0aGVcbnNhbWUgdGVjaG5pcXVlIHdpdGggYW55IG5vZGUgdHlwZS4gRm9yIHlvdXIgZXhhbXBsZSwgeW91IGNvdWxkIGNyZWF0ZSB0aGUgcm9vdCB0YWJsZSBub2RlIGFuZCBpbnNlcnQgdGhlXG5pbm5lckhUTUwgaW50byB0aGF0OlxuXG52YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RhYmxlJyk7XG5mcmFnLmlubmVySFRNTCA9IHRhYmxlSW5uZXJIdG1sO1xuJChcIiNteWRpdlwiKS5hcHBlbmQoZnJhZyk7XG5cbiovXG5cbn0pLmNhbGwodGhpcyk7XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1haW4uanMubWFwIl19
