/* Dashboard intro scenes: window.DashScenes. Data only.
   Adding a city means editing this file only.

   Scene:  { id, timezone, still?, stillSmall?, foreground?, foregroundSmall?, clip?, clipSmall?,
             foregroundClip?, foregroundClipSmall?, minimap?, mirror? }
           timezone     the scene's IANA time zone, e.g. 'America/New_York' (nothing reads it at present)
           still        image seen through the windshield (none: the drawn scene shows)
           stillSmall   the still for phones, when present
           foreground   transparent cut-out of the scene's palms and hotels, same size as the
                        still's top 512 rows, painted over it. Rendered cockpit only,
                        and used only when the scene has a still
           foregroundSmall  the foreground for phones, when present
           clip         six-second video, plays once; clipSmall is used on phones
           foregroundClip  the moving cut-out: the foreground as a video with alpha, played over
                        the clip in step with it. A path without extension: WebKit gets
                        '.mov' (HEVC with alpha), other browsers '.webm' (VP9 with alpha).
                        Rendered cockpit only. It must prove see-through before the clip is
                        requested; a scene with a foreground but no foregroundClip keeps its
                        still there. foregroundClipSmall is used on phones
           minimap      the scene's minimap graphic
           mirror       which mirror gag to show ('paladin' is the only one so far) */
window.DashScenes = {
    scenes: [
        {
            id: 'miami-beach',
            timezone: 'America/New_York',
            still: 'assets/dash/scenes/miami-beach/still-1920.jpg',
            stillSmall: 'assets/dash/scenes/miami-beach/still-960.jpg',
            clip: 'assets/dash/scenes/miami-beach/clip-1920.mp4',
            clipSmall: 'assets/dash/scenes/miami-beach/clip-960.mp4',
            foreground: 'assets/dash/scenes/miami-beach/fg-1920.webp',
            foregroundSmall: 'assets/dash/scenes/miami-beach/fg-960.webp',
            foregroundClip: 'assets/dash/scenes/miami-beach/fgclip-1920',
            foregroundClipSmall: 'assets/dash/scenes/miami-beach/fgclip-960',
            minimap: 'assets/dash/scenes/miami-beach/minimap.svg',
            mirror: 'paladin'
        }
    ]
};
