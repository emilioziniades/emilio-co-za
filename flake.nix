{
  description = "Website that lives at https://emilio.co.za";

  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  outputs = {
    self,
    nixpkgs,
  }: let
    forAllSystems = fn:
      nixpkgs.lib.genAttrs
      ["x86_64-linux" "x86_64-darwin" "aarch64-linux" "aarch64-darwin"]
      (system: fn system nixpkgs.legacyPackages.${system});
  in {
    devShells = forAllSystems (system: pkgs:
      with pkgs; {
        default = mkShell {
          buildInputs = [
            zola
            uv
          ];
        };
      });
  };
}
