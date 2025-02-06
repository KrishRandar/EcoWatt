pragma circom 2.1.6;
template Num2Bits(n) {
    signal input in;
    signal output out[n];
    var lc1 = 0;
    var e2 = 1;
    
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc1 += out[i] * e2;
        e2 = e2 + e2;
    }

    lc1 === in;
}

template LessThan(n) {
    assert(n <= 252);
    signal input in[2];
    signal output out;

    component n2b = Num2Bits(n + 1);

    n2b.in <== in[0] + (1 << n) - in[1];

    out <== 1 - n2b.out[n];
}

template GreaterThan(n) {
    signal input in[2];
    signal output out;

    component lt = LessThan(n);

    lt.in[0] <== in[1];
    lt.in[1] <== in[0];
    lt.out ==> out;
}

template GreaterThanSum() {
    signal input a; 
    signal input b;
    signal input c;
    signal output valid;

    // Sum of a and b
    signal sum;
    sum <== a + b;

    // Use the GreaterThan template to compare sum with c
    component compare = GreaterThan(32);
    compare.in[0] <== sum; // First input is the sum
    compare.in[1] <== c;   // Second input is c

    valid <== compare.out; // The output of GreaterThan is the validity check
}

// Main component instantiation
component main = GreaterThanSum();
