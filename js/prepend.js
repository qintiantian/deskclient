let prepend = {
    computeRawVarint32Size: function (value) {
        if ((value & (0xffffffff <<  7)) == 0) return 1;
        if ((value & (0xffffffff << 14)) == 0) return 2;
        if ((value & (0xffffffff << 21)) == 0) return 3;
        if ((value & (0xffffffff << 28)) == 0) return 4;
        return 5;
    },
    writeRawVarint32: function (value) {
        var size = this.computeRawVarint32Size(value);
        var buffer = new Buffer(size);

        var i = 0;
        while (true) {
            if ((value & ~0x7F) == 0) {
                buffer.writeUInt8(value, i);
                break;
            } else {
                var temp = ((value & 0x7F) | 0x80);
                buffer.writeUInt8(temp, i);
                value >>>= 7;
            }
            i++;
        }
        return buffer;
    },
    merge: function (a, b) {
        return Buffer.concat([a, b], a.length + b.length);
    },

    formFrame: function(data) {
        var header = this.writeRawVarint32(data.length);
        return this.merge(header, data);
    }
}
module.exports = prepend
