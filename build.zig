const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});
    const name = b.option([]const u8, "name", "File name") orelse "engine";
    const strip = b.option(bool, "strip", "Omit debug symbols");

    const exe = b.addExecutable(.{
        .name = name,
        .root_source_file = b.path("src/engine.zig"),
        .target = target,
        .optimize = optimize,
        .strip = strip,
    });
    b.installArtifact(exe);

    const tests = b.addTest(.{
        .root_source_file = b.path("src/engine.zig"),
        .target = target,
        .optimize = optimize,
        .strip = strip,
    });
    const test_cmd = b.addRunArtifact(tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&test_cmd.step);

    var wasm_features = std.Target.wasm.cpu.bleeding_edge.features;
    wasm_features.removeFeature(@intFromEnum(std.Target.wasm.Feature.tail_call)); // for safari
    const wasm = b.addExecutable(.{
        .name = name,
        .root_source_file = b.path("src/engine_wasm.zig"),
        .target = b.resolveTargetQuery(.{
            .cpu_arch = .wasm32,
            .cpu_features_add = wasm_features,
            .os_tag = .freestanding,
        }),
        .optimize = optimize,
        .strip = strip,
    });
    wasm.entry = .disabled;
    wasm.rdynamic = true;
    wasm.import_memory = true;
    const wasm_install = b.addInstallArtifact(wasm, .{});
    const wasm_step = b.step("wasm", "Build wasm");
    wasm_step.dependOn(&wasm_install.step);
}
