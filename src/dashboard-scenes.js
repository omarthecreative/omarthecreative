/* Dashboard intro scenes and banners: window.DashScenes. Data only.
   Adding a city or a banner means editing this file only.

   Scene:  { id, timezone, still?, stillSmall?, foreground?, foregroundSmall?, clip?, clipSmall?, minimap?, mirror? }
           still        image seen through the windshield (none: the drawn scene shows)
           stillSmall   the still for phones, when present
           foreground   transparent cut-out of the scene's palms and hotels, same size as the
                        still's top 512 rows; the banner flies behind it. Rendered cockpit only,
                        and used only when the scene has a still
           foregroundSmall  the foreground for phones, when present
           clip         six-second video, plays once; clipSmall is used on phones
           minimap      the scene's minimap graphic
           mirror       which mirror gag to show ('paladin' is the only one so far)
   Banner: { scene, start, end, lines }
           scene        the scene id it flies over
           start, end   'YYYY-MM-DD', both inclusive, in the scene's time zone
           lines        one or more lines, each six words or fewer. No event logos.
   With no live banner, the plane tows HAVE TASTE. WILL TRAVEL. */
window.DashScenes = {
    scenes: [
        {
            id: 'miami-beach',
            timezone: 'America/New_York',
            minimap: 'assets/dash/scenes/miami-beach/minimap.svg',
            mirror: 'paladin'
        }
    ],
    banners: [
        {
            // Art Basel Miami Beach: 4 to 6 December, preview days 2 and 3 December.
            scene: 'miami-beach',
            start: '2026-11-30',
            end: '2026-12-06',
            lines: [
                'ART BASEL. BASK RESPONSIBLY.',
                'ART BASEL. BYO BANANA.',
                'ART BASEL. NOD KNOWINGLY.',
                "ART BASEL. YES, IT'S ART.",
                'ART BASEL. PARK IN FORT LAUDERDALE.'
            ]
        }
    ]
};
