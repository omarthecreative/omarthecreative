/* Dashboard intro scenes: window.DashScenes. Data only.
   Adding a city means editing this file only.

   Scene:  { id, still?, stillSmall?, clip?, clipSmall?, minimap? }
           still        image seen through the windshield (none: the drawn scene shows)
           stillSmall   the still for phones, when present
           clip         six-second video, plays once over the still; clipSmall is used on phones
           minimap      the scene's minimap graphic */
window.DashScenes = {
    scenes: [
        {
            id: 'miami-beach',
            still: 'assets/dash/scenes/miami-beach/still-1920.jpg',
            stillSmall: 'assets/dash/scenes/miami-beach/still-960.jpg',
            clip: 'assets/dash/scenes/miami-beach/clip-1920.mp4',
            clipSmall: 'assets/dash/scenes/miami-beach/clip-960.mp4',
            minimap: 'assets/dash/scenes/miami-beach/minimap.svg'
        }
    ]
};
