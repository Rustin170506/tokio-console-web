#[test]
// You can use `TRYCMD=overwrite` to overwrite the expected output.
fn cli_tests() {
    let t = trycmd::TestCases::new();
    let console = trycmd::cargo::cargo_bin("tokio-console-web");
    t.register_bin("tokio-console-web", console);
    t.case("tests/cli-ui.toml");
}
