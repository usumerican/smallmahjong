const engine = @import("./engine.zig");
const TileCount = engine.TileCount;
const Distribution = engine.Distribution;

export fn solveWinnableNorm(wc: TileCount, cda: Distribution, cdb: Distribution, cdc: Distribution) TileCount {
    return engine.solveWinnableNorm(wc, cda, cdb, cdc);
}
