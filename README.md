# chl-bookmarks-waveform-video

### Running it

`node . -i [input file path (must be .wav)] -o [output file path] -n [interviewee name]`

e.g.

```bash
node . -i audio.wav -o output.mp4 -n "Geoff Thomas"
```

### Setting it up on your system

This took so long, but it was loads of fun.

Here are the commands to install the CLI stuff on Mac.

```bash
brew uninstall ffmpeg
cd ~
git clone https://git.ffmpeg.org/ffmpeg.git
brew install yasm
brew install pkg-config
pkg-config --cflags librsvg-2.0
./configure --enable-librsvg
make install # this took AGES!
```

You have to install ffmpeg, but build it with librsvg (to handle the SVG images)—this is the `./configure ..` line. The docs for this were terrible—or at least _I_ couldn't find them. I eventually got it working though.

In my folder of .svg images, I ran this command...

```bash
ffmpeg -framerate 25 -pattern_type glob -i '*.svg' output.mp4
```

Pretty self explanatory. The `-pattern_type glob` thing just allows for multiple SVGs to be selected at once.
