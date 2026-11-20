/* Dashboard intro scenes: window.DashScenes. Data only.
   Adding a city means editing this file only.

   Scene:  { id, still?, stillSmall?, clip?, clipSmall?, minimap?, focus? }
           still        image seen through the windshield (none: the drawn scene shows)
           stillSmall   the still for phones, when present
           clip         six-second video, plays once over the still; clipSmall is used on phones
           minimap      the scene's minimap strip: 96 wide, three windows tall
                        (viewBox 96 x 288), its pattern repeating every 192
                        units, so it rolls seamlessly under the fixed arrow
           focus        how far across the scene its landmark stands, 0 to 1 (default 0.60).
                        The phone-portrait crop centres on it; the wide crop ignores it. */
window.DashScenes = {
    scenes: [
        {
            id: 'miami-beach',
            still: 'assets/dash/scenes/miami-beach/still-1920.jpg',
            stillSmall: 'assets/dash/scenes/miami-beach/still-960.jpg',
            clip: 'assets/dash/scenes/miami-beach/clip-1920.mp4',
            clipSmall: 'assets/dash/scenes/miami-beach/clip-960.mp4',
            minimap: 'assets/dash/scenes/miami-beach/minimap-strip.svg'
        },
        {
            id: 'new-york',
            still: 'assets/dash/scenes/new-york/still-1920.jpg',
            stillSmall: 'assets/dash/scenes/new-york/still-960.jpg',
            clip: 'assets/dash/scenes/new-york/clip-1920.mp4',
            clipSmall: 'assets/dash/scenes/new-york/clip-960.mp4',
            minimap: 'assets/dash/scenes/new-york/minimap-strip.svg',
            focus: 0.52
        },
        {
            id: 'tokyo',
            still: 'assets/dash/scenes/tokyo/still-1920.jpg',
            stillSmall: 'assets/dash/scenes/tokyo/still-960.jpg',
            clip: 'assets/dash/scenes/tokyo/clip-1920.mp4',
            clipSmall: 'assets/dash/scenes/tokyo/clip-960.mp4',
            minimap: 'assets/dash/scenes/tokyo/minimap-strip.svg',
            focus: 0.58
        }
    ]
};
