{
  description = "An OCI image built with nix";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = {
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        packages.docker = pkgs.dockerTools.buildLayeredImage {
          name = "cowsay-hello-world";
          tag = "latest";
          contents = [pkgs.cowsay];
          config.Cmd = ["cowsay" "hello" "world"];
        };
      }
    );
}
