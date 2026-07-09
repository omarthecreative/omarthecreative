/**
 * carousel-config.js
 * Shared project data and common utilities for Omar, the Creative.
 */

const projects = [
    {
        title: "GOOGLE",
        subtitle: "Lose the Flash",
        letterSpacing: '-0.02em',
        vimeoId: "306235541",
        img: "assets/03-google-pixel-lose-the-flash-scaled-e1772256909967.png",
        role: "CREATIVE DIRECTOR, WRITER",
        desc: "Dracula sells cameras now.<br>Queen provides the soundtrack.<br>The flash is officially dead.<br><br>We turned Pixel's Night Sight<br>from a spec into a cultural moment.<br>No technical jargon.<br>Just vampires doing<br>what they do best.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">GOOGLE PIXEL 3</div>
                <div class="sc-campaign">"LOSE THE FLASH"</div>
                <div class="sc-format">TELEVISION COMMERCIAL — :35 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">JOAN NY</div>
                <hr class="sc-rule">
            </div>

            <div class="sc-action">MUSIC: "Flash" — Queen / Flash Gordon OST (1980)</div>

            <div class="sc-slug">OPEN — INTERCUT: UGC STILLS + DRACULA</div>

            <p>Bass line. We cut through a rapid series of flash-ruined still photographs — faces washed out, eyes red, moments flattened to white noise. Real. Grainy. User-generated.</p>

            <div class="sc-action">MUSIC: bass line builds</div>

            <p>DRACULA. In his element. Camera flash fires in his face.</p>

            <div class="sc-action">MUSIC (in sync with flash): FREDDIE MERCURY — "FLASH! AH! AHHH!"</div>

            <p>He recoils. More stills. Another flash. DRACULA again — different angle, same indignity.</p>

            <div class="sc-action">MUSIC: "FLASH! AH! AHHH!"</div>

            <p>Then: a still of two women on a plane. One is asleep — mouth open, completely gone. Her friend leans in to sneak a selfie with her. Flash fires. The sleeper jolts awake. The prank is over before it started. The prankster is busted.</p>

            <div class="sc-slug">BEAT TWO — INT. RESTAURANT — NIGHT</div>

            <p>Two foodies lean over a candlelit table, phones raised, firing flash after flash at their food. Their neighbors wince. A couple at the next table shares a look. A waiter passes, completely unfazed. He's seen this every night.</p>

            <div class="sc-action">MUSIC: chorus builds</div>

            <div class="sc-slug">BEAT THREE — INT. SMALL MUSIC VENUE — NIGHT</div>

            <p>A male guitarist performs on a small, warmly lit stage. Intimate. Something real is happening here. An audience member raises a phone — flash fires. The guitarist flinches mid-song. The spell breaks.</p>

            <div class="sc-action">MUSIC: heroic orchestral swell begins</div>

            <p>The same stage. The same man. The same amber light. Two versions of the same shot:</p>

            <p>First — with flash. Blown out. Overexposed. The face obliterated.</p>

            <div class="sc-action">SUPER: "Lose the flash"</div>

            <p>Then — Night Sight. The same frame, perfectly rendered. Warm. Alive. Every detail intact.</p>

            <div class="sc-action">SUPER: "Not the moment"</div>

            <div class="sc-slug">PRODUCT INTRODUCTION — PIXEL 3</div>

            <p>The Pixel 3. The answer.</p>

            <div class="sc-slug">CLOSER — INT. PLANE — NIGHT (CALLBACK)</div>

            <p>The two women from the plane. The prankster leans in again — this time no flash. Her friend is still out cold, mouth open, completely unaware. The shot is perfect. The prankster is delighted. The prank finally lands.</p>

            <div class="sc-action">SUPER: "Night Sight"</div>

            <p>The same super holds as we reveal the photo glowing on a Pixel 3 screen.</p>

            <div class="sc-action">SUPER: "Night Sight" (continuous — over scene and over device)</div>

            <p>The Pixel 3 rotates. Back panel. Clean. Dark.</p>

            <div class="sc-action">SUPER: "Pixel 3"</div>

            <div class="sc-slug">END CARD — WHITE</div>

            <div class="sc-action">Google G logo. :35.</div>
        `,
        credits: [
            {l: "Client", v: "Google"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "Creative Director, Art", v: "Lars Mars Jorgensen"},
            {l: "Chief Creative Officer", v: "Jaime Robinson"},
            {l: "Agency", v: "JOAN NY"},
            {l: "Director", v: "Terri Timely"},
            {l: "Production", v: "Park Pictures"},
            {l: "Edit", v: "Exile"},
            {l: "Post/Color", v: "The Mill"}
        ]
    },
    {
        title: "COCA-COLA",
        subtitle: "Redeclaration Day",
        letterSpacing: '-0.02em',
        vimeoId: "1206647980",
        img: "assets/coca-cola-redeclaration-day.jpg",
        role: "CREATIVE DIRECTOR, WRITER",
        desc: "Six statues. Six nations. One song.<br>We turned Coke's iconic 'Hilltop'<br>into a global toast to independence.<br>No logos. Just one word on each bottle:<br>Life. Liberty. Happiness.<br>Because freedom is the real thing.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">COCA-COLA</div>
                <div class="sc-campaign">"REDECLARATION DAY"</div>
                <div class="sc-format">SPEC COMMERCIAL — :60 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">MEANWHILE IN JUPITER</div>
                <hr class="sc-rule">
            </div>

            <div class="sc-action">MUSIC: "I'd Like to Buy the World a Coke" — Original 1971 recording. Diegetic, starting faint, gaining local instrumentation with each location.</div>

            <div class="sc-slug">01 — LE MARRON INCONNU — Haiti — declared 1804</div>
            <p class="sc-action">Word on bottle: <strong>Liberty</strong>. Light: late-afternoon gold.</p>
            <p class="sc-action">The bronze statue of the Unknown Maroon has a Coca-Cola bottle held in his right hand. The bottle is at his lips, mid-drink. The only motion is a small tilt of the bottle and a lift of his chin, his gaze rising toward the sky as the song begins.</p>

            <div class="sc-slug">02 — SIMÓN BOLÍVAR — Valencia, Venezuela — declared 1811</div>
            <p class="sc-action">Word on bottle: <strong>Life</strong>. Light: midday sun.</p>
            <p class="sc-action">Simón Bolívar stands atop the stone column, his arm extended holding a bottle. He gives a formal, measured nod of the head. At the bottom of the nod, his eyes cut briefly toward the lens, acknowledging the camera, then returns to stillness.</p>

            <div class="sc-slug">03 — CRISTO REDENTOR — Rio de Janeiro, Brazil — declared 1822</div>
            <p class="sc-action">Word on bottle: <strong>Happiness</strong>. Light: early-morning gold.</p>
            <p class="sc-action">His arms are fully open over the city. The statue remains still, but the light flares gently as the sunbeam catches the bottle in his hand. A flock of birds lifts off from the base of the statue as the chorus swells.</p>

            <div class="sc-slug">04 — HỒ CHÍ MINH — Ho Chi Minh City, Vietnam — declared 1945</div>
            <p class="sc-action">Word on bottle: <strong>Life</strong> (Sự sống). Light: dusk.</p>
            <p class="sc-action">His extended arm moves an inch closer to the camera, the white Spencerian script facing the lens. He gives a slow, closed-mouth nod of statesmanlike respect. His eyes stay focused on the bottle.</p>

            <div class="sc-slug">05 — REPLICA STATUE OF LIBERTY — Île aux Cygnes, Paris — the idea, returned</div>
            <p class="sc-action">Word on bottle: <strong>Liberty</strong>. Light: blue hour.</p>
            <p class="sc-action">Paris skyline. Her torch-arm, gripping the bottle, tilts a few degrees toward the lens, marking the first direct gesture aimed at the camera.</p>

            <div class="sc-slug">06 — STATUE OF LIBERTY — New York Harbor — declared 1776</div>
            <p class="sc-action">Word on bottle: <strong>Liberty</strong>. Light: dawn.</p>
            <p class="sc-action">The final rhyme resolves. Her arm raises the bottle toward the lens. She looks directly down the barrel of the camera. The music swells to full volume, resolving on: "It's the real thing."</p>

            <div class="sc-slug">END CARD — DAWN LIGHT</div>
            <p class="sc-action">Text overlays the scene in Coca-Cola Spencerian script:</p>
            <p class="sc-dialogue"><strong>250 Years of Life, Liberty & Happiness.</strong></p>
            <p class="sc-dialogue"><strong>That's the Real Thing.</strong></p>
        `,
        credits: [
            {l: "Client", v: "Coca-Cola (Spec)"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "Agency", v: "Meanwhile In Jupiter"},
            {l: "AI Generation", v: "Google Flow (Veo)"},
            {l: "Sound Design", v: "Meanwhile In Jupiter"},
            {l: "Music", v: "Original 1971 'Hilltop' Recording"}
        ]
    },
    {
        title: "SAMSUNG",
        subtitle: "Stay Ahead of Tomorrow",
        letterSpacing: '-0.02em',
        vimeoId: "442857172",
        img: "assets/04-samsung-stay-ahead-tomorrow.png",
        role: "CREATIVE DIRECTOR, WRITER",
        desc: "Samsung wanted to sell 5G devices.<br>We sold Gen Z<br>their own skepticism instead.<br><br>Let our hero argue with her future.<br>Made global markets copy our playbook.<br>Turns out that little 5G icon<br>changes everything.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">SAMSUNG GALAXY</div>
                <div class="sc-campaign">"STAY AHEAD OF TOMORROW"</div>
                <div class="sc-format">GLOBAL TELEVISION COMMERCIAL — :60 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">PUBLICIS NYC</div>
                <hr class="sc-rule">
            </div>
            <div class="sc-slug">EXT. STREET — DAY</div>

            <p>Our heroine walks, looking at her Samsung Galaxy 5G. Checks out her phone. Curious but skeptical.</p>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">So what does Galaxy 5G …</div>

            <p>She flips the phone — SAMSUNG on the back.</p>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">…really change?</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">More than you think.</div>

            <p>People in costumes from iconic Netflix series begin appearing — first a few, then more, filling the screen as the back-and-forth builds.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Try downloading.</div>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">Like, my favorite show?</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Go for it.</div>

            <p>She downloads. Money Heist robbers sprint past her. She reacts.</p>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">A whole series?</div>

            <p>She taps — a full season of Stranger Things downloads instantly on the Netflix UI. Stranger Things characters surround her. She looks around.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Think bigger.</div>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">What about everything I've ever binged on?</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Yes. In no time.</div>

            <p>30+ Netflix characters flood the frame: Umbrella Academy, BoJack Horseman, The Chilling Adventures of Sabrina, Money Heist, Big Mouth, The Crown, Lost in Space.</p>

            <div class="sc-slug">EXT. PARK — DAY</div>

            <p>Our heroine with a fuzzy-tailed squirrel on her shoulder.</p>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">What if I want to show my friend this little guy?</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Just one friend? You can now call all your friends, and their mama's mamas.</div>

            <p>Her phone screen fills with 25 simultaneous video chats in a multi-frame grid.</p>

            <div class="sc-slug">INT. PING PONG TOURNAMENT</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Now, check out this game.</div>

            <p>Intense ping pong rally. Light speed.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Not that game.</div>

            <p>Cut to a console-level cloud game being played on the Galaxy 5G screen.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">This one.</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Bring on your friends.</div>

            <p>20 friends playing the same game. Pull wider — 75 more. Our heroine wins. She knows it.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Take on the world.</div>

            <div class="sc-slug">INT. BUS — DAY</div>

            <p>Our heroine riding. Galaxy Buds in. Looking out the window like she'd rather be anywhere else.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">You bored?</div>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">Obviously.</div>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">So, let's go to a concert.</div>

            <p>She starts streaming. Over-the-shoulder — she's watching a DJ's live performance. She spins a 360 view. Camera mirrors the spin — she's transported into the concert.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">(yelling) It's like being there.</div>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">(yelling) Without being there.</div>

            <div class="sc-slug">CALLBACK — EXT. STREET</div>

            <p>Our heroine from the opening — now sitting comfortably with the Demogorgon, watching Netflix on her Galaxy 5G.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Galaxy 5G …</div>

            <div class="sc-char">GIRL</div>
            <div class="sc-dialogue">...really changes things.</div>

            <div class="sc-action">SUPER: "Galaxy 5G changes downloading"</div>
            <div class="sc-action">SUPER: "Galaxy 5G changes video calling"</div>
            <div class="sc-action">SUPER: "Galaxy 5G changes gaming"</div>
            <div class="sc-action">SUPER: "Galaxy 5G changes live events"</div>
            <div class="sc-action">SUPER: "EXPERIENCE THE CHANGE"</div>
            <div class="sc-action">CARD: SAMSUNG</div>
        `,
        credits: [
            {l: "Client", v: "Samsung Global"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "Creative Director, Art", v: "Joakim Saul"},
            {l: "Chief Creative Officer", v: "Louis-Philippe Tremblay"},
            {l: "Agency", v: "Publicis NYC"},
            {l: "Director", v: "Sara Dunlop"},
            {l: "Editor", v: "Maury Loeb / PS 260"},
            {l: "Color", v: "Fergus McCall / The Mill"}
        ]
    },
    {
        title: "FERRARI",
        subtitle: "La Tempesta",
        letterSpacing: '-0.01em',
        vimeoId: "1197064979",
        maxDuration: 90,
        img: "assets/ferrari-la-tempesta.jpg",
        role: "CREATIVE DIRECTOR, WRITER",
        desc: "Ferrari built a quiet EV.<br>We gave them the storm back.<br><br>Coined a name. Started a petition.<br>A cinematic protest on behalf of the Tifosi.<br>Rosso Corsa or nothing.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">FERRARI</div>
                <div class="sc-campaign">"LA TEMPESTA"</div>
                <div class="sc-format">SPEC FILM — 1:15 · TIFOSI CUT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, WRITER</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">MEANWHILE IN JUPITER</div>
                <hr class="sc-rule">
            </div>

            <div class="sc-slug">ACT I — VITTORIA</div>
            <p class="sc-action">A rapid, rhythmic montage of historic and modern Ferrari Formula 1 victories. We cut forward in time across decades of racing heritage, from the early black-and-white era to contemporary triumphs.</p>
            <p class="sc-action">AUDIO: The crackling, ecstatic voice of play-by-play announcer (commentatore) Carlo Vanzini screaming in Italian over the roaring engine noise.</p>

            <div class="sc-slug">ACT II — LA TEMPESTA</div>
            <p class="sc-action">The historic racing footage transitions to a stunning reveal of the new Ferrari Luce in Rosso Corsa, renamed here: <strong>LA TEMPESTA</strong>.</p>
            <p class="sc-action">We see the car driving at speed through winding mountain passes, framed against a recently erupted Mount Etna glowing in the background.</p>
            <p class="sc-action">AUDIO: Carlo Vanzini's commentary transitions into the iconic, driving synthesizer hook of "Profondo rosso" by Goblin, the pulsing bassline carrying the film home.</p>

            <div class="sc-slug">ACT III — CLOSE</div>
            <p class="sc-action">Title cards fade in sequentially:</p>
            <p class="sc-dialogue"><strong>La Tempesta.</strong></p>
            <p class="sc-dialogue"><strong>Rosso Corsa or Nothing.</strong></p>

            <div class="sc-slug">END CARD</div>
            <p class="sc-action">SUPER: <strong>bumperstories.xyz</strong></p>
            <p class="sc-action">FOOTER: <em>Not affiliated with Ferrari S.p.A. Made by a Tifoso.</em></p>
        `,
        credits: [
            {l: "Client", v: "Ferrari (Spec)"},
            {l: "Creative Director", v: "Omar Silwany"},
            {l: "Edit & Assembly", v: "Omar Silwany"},
            {l: "AI Generation", v: "Google Flow / Gemini Omni Flash"},
            {l: "Production", v: "Meanwhile In Jupiter"},
            {l: "Sound", v: "Carlo Vanzini (commentatore) / \"Profondo rosso\" by Goblin"}
        ]
    },
    {
        title: "BUD LIGHT",
        subtitle: "Home Advantage",
        letterSpacing: '-0.01em',
        vimeoId: "154384335",
        img: "assets/07-bud-light-home-advantage.png",
        role: "CREATIVE DIRECTOR, COPY",
        desc: "Super Bowl 50 needed a bottle.<br>We gave it a time machine.<br><br>Bud Light doesn't just sell beer;<br>it sells heritage.<br><br>We reminded fans<br>that the home field advantage<br>starts long before kickoff.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">BUD LIGHT</div>
                <div class="sc-campaign">"HOME ADVANTAGE"</div>
                <div class="sc-format">TELEVISION COMMERCIAL — :30 · SUPER BOWL 50 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">VAYNERX</div>
                <hr class="sc-rule">
            </div>

            <div class="sc-slug">INT. LIVING ROOM — 1982</div>

            <p>Close on an original 1982 Budweiser Light bottle. Pan back to reveal a living room: Zenith console, period furniture, friends gathered for Super Bowl XVI — 49ers vs. Bengals, Pontiac Silverdome, Detroit.</p>

            <div class="sc-char">NFL ANNOUNCER</div>
            <div class="sc-dialogue">It's game time!</div>

            <p>Everyone raises their Budweiser Lights. Camera pushes into the TV as the game begins.</p>

            <p>NFL SEQUENCE — Great plays connect across decades. A play from one Super Bowl hands off to the next great play years later:</p>

            <p>Joe Montana's Super Bowl XVI pass — the ball arrives in Cliff Branch's hands for a touchdown in Super Bowl XVIII.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">Since 1982, Bud Light has united every Super Bowl fan, connecting one amazing NFL moment to the next.</div>

            <p>Randle El's 43-yard pass in Super Bowl XL — the ball arrives at David Tyree's helmet in Super Bowl XLII.</p>

            <div class="sc-slug">INT. LIVING ROOM — 2016</div>

            <p>Camera pulls back out of the TV to reveal a present-day living room. LED TV mounted on the wall. Friends together for Super Bowl 50. Pre-game footage plays on screen. A bucket of SB50 bottles chills on ice.</p>

            <div class="sc-char">NFL ANNOUNCER</div>
            <div class="sc-dialogue">It's game time!</div>

            <p>Everyone raises their SB50 bottles. Camera pushes in to a close on the commemorative bottle.</p>

            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">On the Super Bowl's 50th anniversary, we're driving our game forward. Introducing the Bud Light Super Bowl 50 Commemorative Bottle. The only official beer for celebrating all Super Bowl games, always.</div>

            <div class="sc-action">SUPER: "Bud Light. Since 1982. Fans. Forward."</div>
        `,
        credits: [
            {l: "Client", v: "Bud Light"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "GCD", v: "Chris Bradley"},
            {l: "Creative Director, Art", v: "Andy Cummings"},
            {l: "Agency", v: "VaynerX"},
            {l: "Director", v: "Lucy Tcherniak"},
            {l: "Production", v: "Radical Media"},
            {l: "Editor", v: "Charlie Harvey / Whitehouse Post"}
        ]
    },
    {
        title: "CAPiTA",
        subtitle: "Outerspace Living",
        letterSpacing: '-0.02em',
        vimeoId: "1188239303",
        img: "assets/capita-outerspace-living.jpg",
        role: "CREATIVE DIRECTOR, WRITER",
        desc: "Don't show the rider conquering the mountain.<br>Show them returning to it.<br><br>An astronaut snowboards in 1/6th gravity,<br>turning the lunar crater into a canvas.<br>A reminder that Earth is the only spaceship we have.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">CAPiTA SNOWBOARDS</div>
                <div class="sc-campaign">"OUTERSPACE LIVING"</div>
                <div class="sc-format">SPEC COMMERCIAL — :50 · THE OVERVIEW EFFECT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, WRITER</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">MEANWHILE IN JUPITER</div>
                <hr class="sc-rule">
            </div>

            <div class="sc-slug">OPEN — EXT. LUNAR HORIZON — STILL</div>
            <p class="sc-action">The Artemis II Earthset photograph from April 6, 2026. Earth is setting behind the grey lunar horizon. The frame holds completely still. Zero motion.</p>
            <p class="sc-action">AUDIO: Absolute silence. Then, faint shortwave static, followed by the voice of Adlai Stevenson from 1965.</p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">We travel together, passengers on a little spaceship, dependent on its vulnerable reserves of air and soil...</div>

            <div class="sc-slug">EXT. LUNAR SURFACE — WIDE</div>
            <p class="sc-action">The camera drifts forward, low to the grey-brown regolith under a black, airless sky. Shadows are absolute. In the distance, a figure in a white spacesuit stands at the rim of a deep, smooth-walled crater.</p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">...all committed for our safety to its security and peace.</div>

            <div class="sc-slug">EXT. CRATER RIM — MEDIUM</div>
            <p class="sc-action">An astronaut in a white AxEMU pressure suit with red trim. A Capita Outerspace Living board rests in the dust. The astronaut shifts weight, stepping into the bindings, looking down into the bowl.</p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">Preserved from annihilation only by the care, the work...</div>

            <div class="sc-slug">EXT. CRATER INTERIOR — TRACKING</div>
            <p class="sc-action">The astronaut drops in. In 1/6th gravity, the fall is floaty and deliberate. A wake of grey dust erupts from the board's edge, rising and hanging suspended in the vacuum. The astronaut carves down the steep wall, arms wide.</p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">...and I will say the love, that we give to our fragile craft. We cannot maintain it half fortunate, half miserable, half confident, half despairing...</div>

            <div class="sc-slug">EXT. CRATER WALL — AIRBORNE</div>
            <p class="sc-action">The rider sweeps up the far wall and launches off the rim. They rise against the black sky. The Earth hangs in the background. At the apex, one gloved hand grabs the board's rail and thrusts the base toward the camera.</p>
            <p class="sc-action">The underside of the board is revealed: bright teal on the left with the Overview Effect definition; on the dark right side, bold white type reads:</p>
            <p class="sc-dialogue"><strong>IT WILL NOT FAIL BECAUSE OF ME.</strong></p>
            <p class="sc-dialogue"><strong>CAPiTA.</strong></p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">...half slave to the ancient enemies of man, half free in a liberation of resources. No craft, no crew can travel safely with such vast contradictions.</div>

            <div class="sc-slug">EXT. LUNAR SKY — EMPTY</div>
            <p class="sc-action">The astronaut drifts out of frame, leaving only the black sky and the Earth. A tiny speck of dust crosses the frame.</p>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">On their resolution, then, depends the survival of a soul.</div>
            <div class="sc-transition">CUT TO BLACK.</div>
            <div class="sc-char">STEVENSON (V.O.)</div>
            <div class="sc-dialogue">When?</div>

            <div class="sc-slug">CLOSE — EXT. LUNAR HORIZON — STILL</div>
            <p class="sc-action">The same Earthset photo from the opening. It holds in silence, then fades.</p>
            <p class="sc-action">SUPER: <strong>CAPiTA OUTERSPACE LIVING 5.5 II · Made at The Mothership</strong></p>
        `,
        credits: [
            {l: "Client", v: "Capita Snowboards (Spec)"},
            {l: "Creative Director, Writer", v: "Omar Silwany"},
            {l: "Production", v: "Meanwhile In Jupiter"},
            {l: "AI Generation", v: "Google Flow"},
            {l: "Sound Design", v: "BBC Sound Effects Library"},
            {l: "Voiceover", v: "Adlai Stevenson (1965 Geneva)"}
        ]
    },
    {
        title: "CITI",
        subtitle: "Rise",
        vimeoId: "812285745",
        videoScale: 1.35,
        letterSpacing: '-0.01em',
        captionBar: true,
        img: "assets/08-citi-rise.png",
        role: "CREATIVE DIRECTOR, COPY",
        desc: "$1 trillion in sustainable finance<br>is complex.<br>We gave it one simple direction. Up.<br><br>We turned global capital into local impact,<br>proving that profit and purpose<br>aren't just compatible—they're powerful.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">CITI</div>
                <div class="sc-campaign">"RISE"</div>
                <div class="sc-format">TELEVISION COMMERCIAL — :30 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">PUBLICIS NY</div>
                <hr class="sc-rule">
            </div>
            <div class="sc-slug">FADE IN:</div>
            <div class="sc-slug">VARIOUS — MONTAGE</div>
            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">STRIVING TO REACH THE ULTIMATE GOAL OF ZERO POVERTY TAKES MORE THAN EVERYONE'S HOPES AND DREAMS.</div>
            <div class="sc-action">WIDE SHOTS: COMMUNITIES. SMALL BUSINESSES. FAMILIES. THE SCALE OF THE PROBLEM AND THE SCALE OF THE POSSIBLE.</div>
            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">CITI: IT TAKES A FINANCIAL COMMITMENT TO COMPANIES WHO EMPOWER PEOPLE TO LIFT THEMSELVES UP.</div>
            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">IT TAKES FUNDING AND BUILDING ON OUR KNOW-HOW TO HELP COMMUNITIES GROW.</div>
            <div class="sc-action">MONTAGE CONTINUES: RENEWABLE ENERGY INFRASTRUCTURE. A WOMAN OPENING A BUSINESS. A SCHOOL BEING BUILT. EACH IMAGE MOVING UPWARD IN FRAME.</div>
            <div class="sc-char">VOICEOVER</div>
            <div class="sc-dialogue">THAT'S HOW CITI IS HELPING CREATE A BETTER FUTURE — BY COMMITTING ONE TRILLION DOLLARS IN SUSTAINABLE FINANCE BY 2030. BECAUSE IT TAKES EVERYTHING TO REACH ZERO POVERTY.</div>
            <div class="sc-action">SUPER: "CITI." LOGO. FADE OUT.</div>
        `,
        credits: [
            {l: "Client", v: "Citi"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "Creative Director, Art", v: "Kim Davies"},
            {l: "Chief Creative Officer", v: "Erica Roberts"},
            {l: "Agency", v: "Publicis NY"}
        ]
    },
    {
        title: "SAMSUNG",
        subtitle: "Study Is Better with Play",
        letterSpacing: '-0.02em',
        vimeoId: "637229831",
        img: "assets/01-samsung-study-better-play-scaled.png",
        role: "CREATIVE DIRECTOR, COPY",
        desc: "We told students<br>to make play work for them.<br>Then proved it<br>with pen spinning.<br><br>Turned ADHD into a superpower.<br>Made fidgeting fashionable.<br>Convinced a generation<br>that distraction is focus.",
        script: `
            <div class="sc-header">
                <div class="sc-brand">SAMSUNG GALAXY TAB S7 FE</div>
                <div class="sc-campaign">"STUDY IS BETTER WITH PLAY"</div>
                <div class="sc-format">TELEVISION COMMERCIAL — :30 · PRODUCTION DRAFT</div>
                <div class="sc-byline-role">CREATIVE DIRECTOR, COPY</div>
                <div class="sc-byline">OMAR SILWANY</div>
                <div class="sc-agency">BBH USA</div>
                <hr class="sc-rule">
            </div>
            <div class="sc-slug">MUSIC UP.</div>
            <div class="sc-slug">OVERHEAD — TABLE, FOUR TABS</div>
            <div class="sc-action">OPEN FROM ABOVE: FOUR HANDS REACH IN FROM THE EDGES OF FRAME. FOUR COLORED TAB S7 FES ON THE TABLE — GREEN, PINK, SILVER, BLACK. EACH HAND PICKS UP ITS MATCHING S PEN AND BEGINS TO TWIRL.</div>
            <div class="sc-action">SUPER: "INTRODUCING GALAXY TAB S7 FE."</div>
            <div class="sc-transition">CUT TO:</div>
            <div class="sc-slug">INT. GYM — DAY</div>
            <div class="sc-action">A HAND IN THE FOREGROUND — TWIRLING AN S PEN. IN THE BACKGROUND: A SPORTS HALL, STUDENTS IN MOTION. THE S PEN IS A DIFFERENT COLOR FOR EVERY HAND. EACH ONE A MATCH FOR ITS OWNER.</div>
            <div class="sc-action">SUPER: "S PEN IN MATCHING COLORS."</div>
            <div class="sc-transition">CUT TO:</div>
            <div class="sc-slug">C/U — S PEN ON SCREEN</div>
            <div class="sc-action">EXTREME CLOSE-UP: THE TIP OF AN S PEN GLIDING ACROSS THE TAB'S DISPLAY. A COLORFUL ILLUSTRATION BLOOMS BENEATH IT. NAILS PAINTED GREEN WITH A SMILEY FACE. THE SCREEN IS VAST.</div>
            <div class="sc-action">SUPER: "12.4\" BIG SCREEN."</div>
            <div class="sc-transition">CUT TO:</div>
            <div class="sc-slug">EXT. STAIRCASE — DAY</div>
            <div class="sc-action">A STUDENT ON STEPS. THE TAB S7 FE IN ONE HAND, A GALAXY PHONE IN THE OTHER. THE S PEN MOVES BETWEEN THEM — DRAWING ON THE TAB, THE SKETCH MIRRORING ACROSS TO THE PHONE. TWO SCREENS. ONE ECOSYSTEM.</div>
            <div class="sc-action">SUPER: "WORK ACROSS GALAXY DEVICES WITH EASE."</div>
            <div class="sc-transition">CUT TO:</div>
            <div class="sc-slug">EXT. CAMPUS — DAY</div>
            <div class="sc-action">A HAND HOLDS UP A GREEN TAB S7 FE — BACK OF DEVICE TO CAMERA, S PEN SEATED IN ITS SLOT. THE CAMPUS SPRAWLS IN SOFT FOCUS BEHIND IT. STUDENTS GATHERED ON THE GRASS. GOLDEN LIGHT.</div>
            <div class="sc-action">SUPER: "STUDY IS BETTER WITH PLAY."</div>
            <div class="sc-transition">SMASH CUT TO:</div>
            <div class="sc-slug">PRODUCT SHOT</div>
            <div class="sc-action">ALL FOUR COLORS OF THE GALAXY TAB S7 FE — FANNED OUT, SCREENS FACING, S PENS BESIDE THEM. CLEAN. CONFIDENT.</div>
            <div class="sc-action">SUPER: "GALAXY TAB S7 FE."</div>
            <div class="sc-transition">CUT TO:</div>
            <div class="sc-slug">LOGO CARD — BLACK</div>
            <div class="sc-action">SAMSUNG. MUSIC OUT.</div>
        `,
        credits: [
            {l: "Client", v: "Samsung"},
            {l: "Creative Director, Copy", v: "Omar Silwany"},
            {l: "Creative Director, Art", v: "Coral Garvey"},
            {l: "Senior Copywriter", v: "Patrick DeYoung"},
            {l: "Senior Art Director", v: "Rosendo Ayala"},
            {l: "Chief Creative Officer", v: "Rafael Rizuto"},
            {l: "Agency", v: "BBH USA"},
            {l: "Director", v: "We Are From LA"},
            {l: "Color", v: "Company3"}
        ]
    },
    { 
        title: "MBK ALLIANCE",
        subtitle: "We Are the Ones",
        letterSpacing: '-0.01em',
        vimeoId: "267027000",
        img: "assets/02-mbk-we-are-the-ones-scaled-e1772257041527.png", 
        role: "CREATIVE DIRECTOR, WRITER", 
        desc: "One voice becomes a movement.<br>Obama listens.<br>Curry takes note.<br>Chance amplifies.<br><br>And it all starts<br>when a kid decides to speak.<br>50 million impressions.<br>Zero paid media.<br><br>Just truth traveling<br>at the speed of culture.",
        script: `
            <div class="sc-dark" style="background:#050505;color:#fff;margin:-12px;padding:0;font-family:var(--mono);">

                <img src="assets/obama-hero-image/Lincoln_Memorial_Warren_Eakins.jpg"
                     alt="We Are The Ones — Lincoln Memorial"
                     style="width:100%;display:block;object-fit:cover;max-height:280px;filter:brightness(0.75);">

                <div style="padding:28px 48px 0;">
                    <div style="font-size:7px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:20px;">ORIGIN</div>

                    <blockquote style="margin:0 0 12px;padding:0;border:none;">
                        <p style="font-family:var(--serif);font-style:italic;font-size:13px;line-height:1.8;color:#fff;margin:0 0 16px;">
                            "Change will not come if we wait for some other person or if we wait for some other time. We are the ones we've been waiting for. We are the change that we seek. We are the hope of those boys who have so little, who've been told that they cannot have what they dream, that they cannot be what they imagine. Yes, they can."
                        </p>
                        <cite style="font-size:8px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.55);font-style:normal;">— Senator Barack Obama &nbsp;·&nbsp; February 5, 2008</cite>
                    </blockquote>

                    <hr style="border:none;border-top:1px solid rgba(255,255,255,0.15);margin:28px 0;">

                    <div style="font-size:7px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.45);margin-bottom:20px;">THE CONCEPT &nbsp;·&nbsp; WE ARE THE ONES MANIFESTO</div>

                    <p style="font-size:11px;line-height:1.9;color:rgba(255,255,255,0.85);margin:0 0 16px;">Our country was defined by great battles. Such was the case in 1814 when brave men both black and white fought side-by-side to keep our star-spangled banner in the sky. And such is the case today when the bravery of all races faces the persistent front of injustice, keeping faith in each one's humanity to become the other's keeper.</p>

                    <p style="font-size:11px;line-height:1.9;color:#fff;margin:0 0 6px;">When we look up and ask for light: <strong>We Are The Ones.</strong></p>
                    <p style="font-size:11px;line-height:1.9;color:#fff;margin:0 0 6px;">When we listen for the words that keep our spirits high: <strong>We Are The Ones.</strong></p>
                    <p style="font-size:11px;line-height:1.9;color:#fff;margin:0 0 20px;">And when we sing of bravery's home and freedom's land: <strong>We Are The Ones.</strong></p>

                    <p style="font-size:11px;line-height:1.9;color:rgba(255,255,255,0.85);margin:0 0 16px;">Young Americans locked arm-in-arm instead of raising arms. Perfectly united and free,<br>with the inextinguishable hope to be judged not for the color of our skin but for<br>the color in our hearts.</p>

                    <p style="font-size:11px;line-height:1.9;color:#fff;margin:0 0 28px;">We are each other's keepers.</p>

                    <div style="font-size:7px;letter-spacing:0.15em;text-transform:uppercase;color:rgba(255,255,255,0.35);padding-bottom:24px;">Omar Silwany &nbsp;&amp;&nbsp; Warren Eakins &nbsp;·&nbsp; Matter Unlimited &nbsp;·&nbsp; 2017</div>
                </div>
            </div>
        `,
        credits: [
            {l: "Conceptor", v: "Omar Silwany"},
            {l: "Conceptor", v: "Warren Eakins"},
            {l: "Agency", v: "Matter Unlimited"},
            {l: "Director", v: "Dave Meyers"}
        ]
    }
];

const caseStudies = [
    {
        title: "PROJECT ROCK <span style=\"white-space: nowrap;\"><span class=\"collab-x\">x</span> UNDER ARMOUR</span>",
        subtitle: "It Takes an Iron Will",
        img: "assets/wp-uploads/DJ_Red.jpg",
        slug: "project-rock.html",
        client: "Project Rock x UnderArmour",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "MBK ALLIANCE",
        subtitle: "We Are The Ones",
        img: "assets/obama-hero-image/Lincoln_Memorial_Warren_Eakins.jpg",
        slug: "obama-foundation.html",
        client: "MBK Alliance",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "GOOGLE",
        subtitle: "Window Wonderland",
        img: "assets/wp-uploads/Google_Window_Wonderland_still_generated.jpg",
        slug: "google-wonderland.html",
        client: "GOOGLE",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "SKYY VODKA",
        subtitle: "West of Expected",
        img: "assets/skyy-vodka-bg.jpg",
        slug: "skyy-vodka.html",
        client: "SKYY",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "ESPOLÓN TEQUILA",
        subtitle: "The Instigator",
        img: "assets/espolon-tequila-bg.jpg",
        slug: "espolon-tequila.html",
        client: "ESPOLÓN",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "THE BALVENIE",
        subtitle: "Long Odds",
        img: "assets/balvenie-patience-bg.jpg",
        slug: "balvenie-patience.html",
        client: "THE BALVENIE",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "GLENFIDDICH",
        subtitle: "Portal Into 1963",
        img: "assets/glenfiddich-original-bg.jpg",
        slug: "glenfiddich-original.html",
        client: "GLENFIDDICH",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "BENTLEY",
        subtitle: "Visionary Experience",
        img: "assets/bentley-hero.jpg",
        slug: "bentley-studio.html",
        client: "BENTLEY",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "GUINNESS",
        subtitle: "Amplify",
        img: "assets/guinness-amplify-bg.jpg",
        slug: "guinness-amplify.html",
        client: "GUINNESS",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "STOLI NIGHT EDITION",
        subtitle: "Illuminate Your Night",
        img: "assets/stoli-night-bg.jpeg",
        slug: "stoli-night-edition.html",
        client: "STOLI",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "AMERICAN EXPRESS",
        subtitle: "From This Moment, On",
        img: "assets/amex-moments-bg.jpg",
        slug: "amex-moments.html",
        client: "AMERICAN EXPRESS",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "AUDI",
        subtitle: "Truth Be Bold",
        img: "assets/audi-big-wave-bg.jpeg",
        slug: "audi-truth-be-bold.html",
        client: "AUDI",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "PANASONIC LUMIX",
        subtitle: "LuV Moves Me",
        img: "assets/panasonic-luv-bg.jpg",
        slug: "panasonic-luv.html",
        client: "PANASONIC",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "PANASONIC LUMIX",
        subtitle: "For Every Photonista",
        img: "assets/panasonic-photonista-bg.jpg",
        slug: "panasonic-photonista.html",
        client: "PANASONIC",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "HONDA HYBRIDS",
        subtitle: "Naturally Driven",
        img: "assets/honda-grass-flowers-bg.png",
        slug: "honda-hybrids.html",
        client: "HONDA",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "JOHNNIE WALKER",
        subtitle: "Conquista La Noche",
        img: "assets/johnnie-walker-hero-bg.jpg",
        slug: "johnnie-walker-conquista.html",
        client: "DIAGEO",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "VERIZON",
        subtitle: "Droids",
        img: "assets/verizon-droid-sky.png",
        slug: "verizon-droid.html",
        client: "VERIZON",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "CRAYOLA",
        subtitle: "The 64 Days of Crayola",
        img: "assets/crayola-hero-bg.jpg",
        slug: "crayola-64-days.html",
        client: "CRAYOLA",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "CHASE",
        subtitle: "Sapphire. Slate. Ink. & Liquid.",
        img: "assets/chase-hero-bg.jpg",
        slug: "chase-blue.html",
        client: "CHASE",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "KRAFT",
        subtitle: "Dish",
        img: "assets/kraft-hero-bg.jpg",
        slug: "kraft-dish.html",
        client: "KRAFT",
        role: "CREATIVE DIRECTOR, WRITER"
    },
    {
        title: "DISNEY RESORTS",
        subtitle: "Be Our Guest",
        img: "assets/disney-hero-bg.png",
        slug: "disney-be-our-guest.html",
        client: "DISNEY",
        role: "CREATIVE DIRECTOR, WRITER"
    }
];


function markAsViewed(id) {
    let viewed = JSON.parse(localStorage.getItem('omar_viewed') || '[]');
    if (!viewed.includes(id)) {
        viewed.push(id);
        localStorage.setItem('omar_viewed', JSON.stringify(viewed));
    }
}
