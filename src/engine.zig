const std = @import("std");
const tst = std.testing;

const Rank = u4;
const R1: Rank = 0;
const R2: Rank = 1;
const R3: Rank = 2;
const R4: Rank = 3;
const R5: Rank = 4;
const R6: Rank = 5;
const R7: Rank = 6;
const R8: Rank = 7;
const R9: Rank = 8;
const RANKS = [_]Rank{ R1, R2, R3, R4, R5, R6, R7, R8, R9 };

pub const TileCount = u8;
const WINNABLE_COUNTS = [_]TileCount{ 0, 2, 3, 5, 6, 8, 9, 11, 12, 14 };
const WINNABLE_COUNT_INDICES = [_]usize{ 0, 10, 1, 2, 10, 3, 4, 10, 5, 6, 10, 7, 8, 10, 9 };

const Frequency = u3;
const FREQUENCIES = [_]Frequency{ 0, 1, 2, 3, 4 };

pub const Distribution = u32;
const DISTRIBUTION_FULL = 0o444444444;

fn getDistributionFrequency(d: Distribution, r: Rank) Frequency {
    return @truncate(d >> (3 * @as(u5, r)));
}

test "getDistributionFrequency" {
    try tst.expectEqual(0, getDistributionFrequency(0, R1));
    try tst.expectEqual(4, getDistributionFrequency(0o1234, R1));
    try tst.expectEqual(3, getDistributionFrequency(0o1234, R2));
    try tst.expectEqual(0, getDistributionFrequency(0o1234, R9));
}

fn addDistributionFrequency(d: Distribution, r: Rank, f: Frequency) Distribution {
    return d + (@as(Distribution, f) << (3 * @as(u5, r)));
}

test "addDistributionFrequency" {
    try tst.expectEqual(0o2, addDistributionFrequency(0o1, R1, 1));
    try tst.expectEqual(0o400000001, addDistributionFrequency(0o1, R9, 4));
}

fn subtractDistributionFrequency(d: Distribution, r: Rank, f: Frequency) Distribution {
    return d - (@as(Distribution, f) << (3 * @as(u5, r)));
}

test "subtractDistributionFrequency" {
    try tst.expectEqual(0o1, subtractDistributionFrequency(0o2, R1, 1));
    try tst.expectEqual(0o1, subtractDistributionFrequency(0o400000001, R9, 4));
}

fn getDistributionNorm(from: Distribution, to: Distribution) TileCount {
    var n: TileCount = 0;
    for (RANKS) |r| {
        n += getDistributionFrequency(to, r) -| getDistributionFrequency(from, r);
    }
    return n;
}

test "getDistributionNorm" {
    try tst.expectEqual(0, getDistributionNorm(0, 0));
    try tst.expectEqual(8, getDistributionNorm(0o432104321, 0o123401234));
}

const WINNABLE_DISTRIBUTION_INDICES = [_]usize{ 0, 1, 1, 10, 26, 26, 161, 288, 288, 1284, 1911, 1911, 6386, 8484, 8484, 21743 };

fn loadMeldDistributions(meld_count: usize, curr: Distribution, rest: Distribution, slice: *[]Distribution) void {
    if (meld_count == 0) {
        if (std.mem.indexOfScalar(Distribution, slice.*, curr) == null) {
            slice.len += 1;
            slice.*[slice.len - 1] = curr;
        }
        return;
    }
    for (RANKS) |r| {
        if (getDistributionFrequency(rest, r) >= 3) {
            loadMeldDistributions(
                meld_count - 1,
                addDistributionFrequency(curr, r, 3),
                subtractDistributionFrequency(rest, r, 3),
                slice,
            );
        }
    }
    for (RANKS[0 .. RANKS.len - 2]) |r| {
        if (getDistributionFrequency(rest, r) > 0 and
            getDistributionFrequency(rest, r + 1) > 0 and
            getDistributionFrequency(rest, r + 2) > 0)
        {
            loadMeldDistributions(
                meld_count - 1,
                addDistributionFrequency(
                    addDistributionFrequency(addDistributionFrequency(curr, r, 1), r + 1, 1),
                    r + 2,
                    1,
                ),
                subtractDistributionFrequency(
                    subtractDistributionFrequency(subtractDistributionFrequency(rest, r, 1), r + 1, 1),
                    r + 2,
                    1,
                ),
                slice,
            );
        }
    }
}

test "loadMeldDistributions" {
    var distributions: [21743]Distribution = undefined;
    var slice: []Distribution = &distributions;
    slice.len = 0;
    loadMeldDistributions(0, 0, DISTRIBUTION_FULL, &slice);
    try tst.expectEqual(1, slice.len);

    slice.len = 0;
    loadMeldDistributions(1, 0, DISTRIBUTION_FULL, &slice);
    try tst.expectEqual(16, slice.len);
}

fn loadWinnableDistributions(winnable_count: TileCount, slice: *[]Distribution) void {
    const meld_count = winnable_count / 3;
    switch (winnable_count % 3) {
        0 => loadMeldDistributions(meld_count, 0, DISTRIBUTION_FULL, slice),
        2 => for (RANKS) |r| {
            loadMeldDistributions(
                meld_count,
                addDistributionFrequency(0, r, 2),
                subtractDistributionFrequency(DISTRIBUTION_FULL, r, 2),
                slice,
            );
        },
        else => {},
    }
}

test "loadWinnableDistributions" {
    var distributions: [21743]Distribution = undefined;
    var slice: []Distribution = &distributions;
    slice.len = 0;
    for (0..@as(TileCount, 14)) |wc| {
        loadWinnableDistributions(@truncate(wc), &slice);
        try tst.expectEqual(WINNABLE_DISTRIBUTION_INDICES[wc + 1], slice.len);
    }
}

const WINNABLE_DISTRIBUTIONS = std.mem.bytesAsSlice(Distribution, @embedFile("bin/winnable_distributions.dat"));

test "WINNABLE_DISTRIBUTIONS" {
    try tst.expectEqual(0, WINNABLE_DISTRIBUTIONS[0]);
    try tst.expectEqual(0o2, WINNABLE_DISTRIBUTIONS[1]);
}

fn loadConcealedDistributions(slice: *[]Distribution) void {
    for (FREQUENCIES) |f9| {
        const s9: usize = f9;
        const d9 = addDistributionFrequency(0, R9, f9);
        for (FREQUENCIES) |f8| {
            const s8 = s9 + f8;
            if (s8 > 13) {
                break;
            }
            const d8 = addDistributionFrequency(d9, R8, f8);
            for (FREQUENCIES) |f7| {
                const s7 = s8 + f7;
                if (s7 > 13) {
                    break;
                }
                const d7 = addDistributionFrequency(d8, R7, f7);
                for (FREQUENCIES) |f6| {
                    const s6 = s7 + f6;
                    if (s6 > 13) {
                        break;
                    }
                    const d6 = addDistributionFrequency(d7, R6, f6);
                    for (FREQUENCIES) |f5| {
                        const s5 = s6 + f5;
                        if (s5 > 13) {
                            break;
                        }
                        const d5 = addDistributionFrequency(d6, R5, f5);
                        for (FREQUENCIES) |f4| {
                            const s4 = s5 + f4;
                            if (s4 > 13) {
                                break;
                            }
                            const d4 = addDistributionFrequency(d5, R4, f4);
                            for (FREQUENCIES) |f3| {
                                const s3 = s4 + f3;
                                if (s3 > 13) {
                                    break;
                                }
                                const d3 = addDistributionFrequency(d4, R3, f3);
                                for (FREQUENCIES) |f2| {
                                    const s2 = s3 + f2;
                                    if (s2 > 13) {
                                        break;
                                    }
                                    const d2 = addDistributionFrequency(d3, R2, f2);
                                    for (FREQUENCIES) |f1| {
                                        if (s2 + f1 > 13) {
                                            break;
                                        }
                                        slice.len += 1;
                                        slice.*[slice.len - 1] = addDistributionFrequency(d2, R1, f1);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

const CONCEALED_DISTRIBUTIONS = std.mem.bytesAsSlice(Distribution, @embedFile("bin/concealed_distributions.dat"));

test "CONCEALED_DISTRIBUTIONS" {
    try tst.expectEqual(0, CONCEALED_DISTRIBUTIONS[0]);
    try tst.expectEqual(1, CONCEALED_DISTRIBUTIONS[1]);
    try tst.expectEqual(0o444100000, CONCEALED_DISTRIBUTIONS[CONCEALED_DISTRIBUTIONS.len - 1]);
    try tst.expectEqual(true, std.sort.isSorted(Distribution, @alignCast(CONCEALED_DISTRIBUTIONS), {}, std.sort.asc(Distribution)));
}

fn compareDistributions(_: void, lhs: Distribution, rhs: Distribution) std.math.Order {
    return std.math.order(lhs, rhs);
}

fn findConcealedDistributionIndex(d: Distribution) usize {
    return std.sort.binarySearch(Distribution, d, @alignCast(CONCEALED_DISTRIBUTIONS), {}, compareDistributions) orelse CONCEALED_DISTRIBUTIONS.len;
}

test "findConcealedDistributionIndex" {
    try tst.expectEqual(0, findConcealedDistributionIndex(0));
    try tst.expectEqual(1, findConcealedDistributionIndex(1));
    try tst.expectEqual(CONCEALED_DISTRIBUTIONS.len - 1, findConcealedDistributionIndex(0o444100000));
}

fn loadWinnableNorms(slice: *[]TileCount) void {
    for (CONCEALED_DISTRIBUTIONS) |from| {
        for (WINNABLE_COUNTS) |wc| {
            var minNorm = wc;
            for (WINNABLE_DISTRIBUTIONS[WINNABLE_DISTRIBUTION_INDICES[wc]..WINNABLE_DISTRIBUTION_INDICES[wc + 1]]) |to| {
                const n = getDistributionNorm(from, to);
                if (n < minNorm) {
                    minNorm = n;
                }
            }
            slice.len += 1;
            slice.*[slice.len - 1] = minNorm;
        }
    }
}

const WINNABLE_NORMS = std.mem.bytesAsSlice(TileCount, @embedFile("bin/winnable_norms.dat"));

fn findWinnableNorm(cdi: usize, wci: usize) TileCount {
    return WINNABLE_NORMS[cdi * WINNABLE_COUNTS.len + wci];
}

test "findWinnableNorm" {
    try tst.expectEqual(0, findWinnableNorm(0, 0));
    try tst.expectEqual(2, findWinnableNorm(0, 1));
    try tst.expectEqual(1, findWinnableNorm(findConcealedDistributionIndex(0o444100000), 9));
}

pub fn solveWinnableNorm(wc: TileCount, cda: Distribution, cdb: Distribution, cdc: Distribution) TileCount {
    var min_norm: TileCount = wc;
    if (wc == 14) {
        min_norm = 7;
        for (RANKS) |r| {
            if (getDistributionFrequency(cda, r) >= 2) {
                min_norm -= 1;
            }
            if (getDistributionFrequency(cdb, r) >= 2) {
                min_norm -= 1;
            }
            if (getDistributionFrequency(cdc, r) >= 2) {
                min_norm -= 1;
            }
        }
        if (min_norm <= 1) {
            return min_norm;
        }
    }
    const wci = WINNABLE_COUNT_INDICES[wc];
    const cdia = findConcealedDistributionIndex(cda);
    const cdib = findConcealedDistributionIndex(cdb);
    const cdic = findConcealedDistributionIndex(cdc);
    if (cdia < CONCEALED_DISTRIBUTIONS.len and cdib < CONCEALED_DISTRIBUTIONS.len and cdic < CONCEALED_DISTRIBUTIONS.len) {
        for (0..wci + 1) |wcia| {
            const wca = WINNABLE_COUNTS[wcia];
            for (0..wci - wcia + 1) |wcib| {
                const sb = wca + WINNABLE_COUNTS[wcib];
                if (sb > wc) {
                    break;
                }
                const wcic = WINNABLE_COUNT_INDICES[wc - sb];
                if (wcic < WINNABLE_COUNTS.len) {
                    const norm = findWinnableNorm(cdia, wcia) + findWinnableNorm(cdib, wcib) + findWinnableNorm(cdic, wcic);
                    if (norm <= 1) {
                        return norm;
                    }
                    if (norm < min_norm) {
                        min_norm = norm;
                    }
                }
            }
        }
    }
    return min_norm;
}

test "solveWinnableNorm" {
    try tst.expectEqual(3, solveWinnableNorm(14, 0o1011, 0o1110000, 0o110110111));
    try tst.expectEqual(4, solveWinnableNorm(14, 0o1031301, 0o1001001, 0o1001));
    try tst.expectEqual(3, solveWinnableNorm(5, 0o1001001, 0o1001, 0));
    try tst.expectEqual(5, solveWinnableNorm(8, 0o1001001, 0o1001001, 0o1001));
    try tst.expectEqual(6, solveWinnableNorm(11, 0o1001001, 0o1001001, 0o201001001));
    try tst.expectEqual(2, solveWinnableNorm(14, 0o1002002, 0o2001002, 0o2001));
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    const argv = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, argv);
    const command = if (argv.len > 1) argv[1] else "";
    if (std.mem.eql(u8, command, "winnable_distributions")) {
        var winnable_distributions: [21743]Distribution = undefined;
        var slice: []Distribution = &winnable_distributions;
        slice.len = 0;
        for (WINNABLE_COUNTS) |wc| {
            loadWinnableDistributions(wc, &slice);
        }
        const writer = std.io.getStdOut().writer();
        for (winnable_distributions) |d| {
            try writer.writeInt(Distribution, d, .little);
        }
        std.debug.print("len: {d}\n", .{slice.len});
    } else if (std.mem.eql(u8, command, "concealed_distributions")) {
        var concealed_distributions: [286550]Distribution = undefined;
        var slice: []Distribution = &concealed_distributions;
        slice.len = 0;
        loadConcealedDistributions(&slice);
        const writer = std.io.getStdOut().writer();
        for (concealed_distributions) |d| {
            try writer.writeInt(Distribution, d, .little);
        }
        std.debug.print("len: {d}\n", .{slice.len});
    } else if (std.mem.eql(u8, command, "winnable_norms")) {
        var winnable_norms: [286550 * WINNABLE_COUNTS.len]TileCount = undefined;
        var slice: []TileCount = &winnable_norms;
        slice.len = 0;
        loadWinnableNorms(&slice);
        const writer = std.io.getStdOut().writer();
        for (winnable_norms) |n| {
            try writer.writeInt(TileCount, n, .little);
        }
        std.debug.print("len: {d}\n", .{slice.len});
    }
}
