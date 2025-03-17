+++
title = "Building Docker images with Nix on MacOS"
date = "2025-03-15"
description = "How to use nix-darwin's linux builder to build Docker images using a flake"
+++

# The problem

I am busy working on a new side project.
I'd like to deploy it in a container to [Fly.io](https://fly.io).
I am already using Nix for the project's development environment.
So, why not use Nix to build the Docker image too?

In order to test my Docker image, I wanted to build it and run it locally on my `x86_64` MacOS Laptop.
This post explains how I acheived that.

As a short aside, please note that I will be referring to "OCI images" or "container images" instead of "Docker images" in the rest of this post.
They are essentially the same, but the former is more precise.
They are both images built according to the OCI image format specification.

# The flake

So, after reading [the documentation](https://nixos.org/manual/nixpkgs/stable/#sec-pkgs-dockerTools) and looking at an [example](https://xeiaso.net/talks/2024/nix-docker-build/), I put together a flake with a container image as an output.
For the sake of this post, I have made a simple container image that executes `cowsay hello world` and exits.
Here is the `flake.nix`.

```nix,hide_lines=27
{{ include(path="content/blog/nix-oci-images-macos/flake.nix") }}
```

The flake is a little boilerplate-y, but the important part is the `packages.container` output that calls the `dockerTools.buildLayeredImage` function.
In addition to the image name and tag, we include `cowsay` and set the `CMD` for the image.

Now, if I naively try to build this on my MacOS machine, the build simply hangs.

```
$ nix build .#container
... building cowsay-hello-world-customisation-layer
```

I understand that this _shouldn't work_, since we are trying to build a docker image for `x86_64-darwin`, but I'm curious _why_ it doesn't work.
If you are reading this and know the answer, please let me know!

So, instead of building an `x86_64-darwin` OCI image, we want to build for the `x86_64-linux` platform.
There are two ways to acheive this:

1. Build on a `x86_64-linux` (virtual) machine
2. Cross compilation

This post settles for the first approach.
I considered the second approach, but ran into significant roadblocks.
See the end of the post for more discussion.

Doing some research, Docker Desktop also does it the first way.
It runs a Linux virtual machine and does builds on this virtual machine.
[This post](https://www.docker.com/blog/the-magic-behind-the-scenes-of-docker-desktop/) is an interesting write up.

# The nix-darwin Linux builder

Luckily, [nix-darwin](https://github.com/LnL7/nix-darwin) already has a built-in Linux builder that we can leverage.

This post assumes the reader has already installed `nix-darwin` on their MacOS machine.
If not, you can follow the [installation instructions](https://daiderd.com/nix-darwin/).

Configuring the Linux builder is straightforward. In your `darwin-configuration.nix`, add the following settings.

```nix
{
    nix.linux_builder.enable = true;
    nix.settings.trusted-users = ["@admin"];
}
```

Adding the `admin` group to the list of trusted users is necessary so that the SSH credentials for the Linux builder can be accessed during the build.

There are more [configuration options](https://daiderd.com/nix-darwin/manual/index.html#opt-nix.linux-builder.enable) for the Linux builder, but the defaults worked fine for me.

Then, run `darwin-rebuild switch` to apply the new configuration. You should see some output indicating that the Linux builder is being setup.

# Using the Linux builder

To use the builder, we invoke `nix build` with some extra flags.

```bash
nix build --builders 'linux-builder x86_64-linux /etc/nix/builder_ed25519' .#packages.x86_64-linux.container
```

Now, we are being explicit about which architecture the package should be built for: `.#packages.x86_64-linux.container`.

Also, the `--builders` flag expects a string in a certain format. We passed it `'<host name> <platform> <SSH identity file>'`.
`nix-darwin` makes things easy for us by setting up an SSH configuration file for a host named `linux-builder` so we do not need to specify the full URI of the remote builder.
It also creates SSH keys at a default location, `/etc/nix/builder_ed25519`.
See [the documentation](https://nix.dev/manual/nix/2.18/advanced-topics/distributed-builds) for a more detailed discussion of remote builds.

If all went well, there will be a file, `result`, which is a compressed OCI image.

```
$ file result
result: symbolic link to /nix/store/0mixbwv945yr64jsc6jla0384mdn9l4z-cowsay-hello-world.tar.gz

$ file -Lz result
result: POSIX tar archive (gzip compressed data, from Unix)
```

To run the container image and confirm it works, you need a container runtime installed and running on your machine. I used Docker Desktop.

```
$ docker load < result
Loaded image: cowsay-hello-world:latest

$ docker run cowsay-hello-world:latest
 _____________
< hello world >
 -------------
        \   ^__^
         \  (oo)\_______
            (__)\       )\/\
                ||----w |
                ||     ||

```

Success!

# Limitations

The above approach was good enough for me, since all I wanted was to build my docker image locally and test it.
For production I have a CI pipeline running on Linux where the builds will happen, so there is no need for remote builder shenanigans.

But there are clear limitations of this approach.
It only works for the same CPU type. `x86_64-darwin` can only build `x86_64-linux` docker images. You can't build `aarch64-linux` images this way.
Similarly, if you were using a newer Apple silicon laptop, your `aarch64-darwin` machine could only build `aarch64-linux`.

However, it's worth mentioning [rosetta-builder](https://github.com/cpick/nix-rosetta-builder) which can build `x86_64-linux` and `aarch64-linux` from an `aarch64-darwin` machine using Rosetta.

# Cross compilation

In theory, you should be able to acheive the same goal using Nix's built-in support for [cross compilation](https://nix.dev/tutorials/cross-compilation.html) with `pkgsCross`.
I did briefly try this, but Hydra, Nix's build farm, does not cache `pkgsCross`, presumably because of the combinatorial explosion of target/host platform pairs.
This means that you will end up building `stdenv` and anything else you need from scratch with zero cache hits.

Because `cowsay` is written in Perl, we would need to build the Perl interpreter locally.
And to build Perl locally, we need `gcc`.
So we need to build `gcc` locally.
You can see how this gets out of hand really quickly.

One day I will figure out cross-compilation with Nix.
It seems very powerful.
But today is not that day.

# Comparison to a Dockerfile

The OCI image we built with Nix is roughly comparable to this Dockerfile.

```dockerfile,hide_lines=4
{{ include(path="content/blog/nix-oci-images-macos/Dockerfile") }}
```

Clearly this is less verbose than the Nix flake equivalent.

I got stuck for a while figuring out how to install `cowsay` in an Alpine container.
Turns out you need to point `apk` at the `testing` repository.
In my experience with using Docker for $WORK, this is a common theme.
Each piece of software is installed differently on each distribution.
It is not uncommon to compile something from source inside a Dockerfile, or pull random binaries from the internet.
What is nice about the Nix approach is that there is always one place to install things from: nixpkgs.
Well, unless the vast nixpkgs is missing the software you need.
In which case you need to create your own Nix derivation.

Another benefit of the Nix approach is that you do not need Docker (or another container runtime) running in your build environment.

Then, there is the question of reproduciblity.
The Nix flake above is locked to a certain version of nixpkgs.
So, the same version of `cowsay` will be used every time.

This is not the case with the Dockerfile approach, where the version of `cowsay` could change in the upstream repository.
In addition, the `alpine:edge` tag can also be pointed at a different image.
You could build the OCI image twice from the exact same Dockerfile, and the images might differ.
This is not a dealbreaker, and for most practical applications, reproduciblity is not a high priority.

Finally, we can compare the image sizes. The Nix image was 107MB, whereas the Alpine Dockerfile image was 48MB.
To be fair, I did also try a Debian-based Dockerfile and that was larger at 185MB.
But using Alpine is hardly a sophisticated optimization, and I'm unsure how to reduce the Nix image size without digging into and modifying the `cowsay` derivation.

Overall, I like the Nix approach because it uses the same infrastructure I use to build my project, and it removes the need for Docker on my laptop or build server.
But clearly it is a little more awkward than the Dockerfile approach and produced a relatively larger image.

I will probably stick with a Dockerfile.
In any case, it was a fun learning experience.
