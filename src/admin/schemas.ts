export type FieldType = 'text' | 'textarea' | 'url' | 'date' | 'select' | 'boolean' | 'strings' | 'list' | 'image' | 'audio' | 'number';

export interface Field {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  options?: string[];
  fields?: Field[]; // for type "list": the fields of each item
  multiline?: boolean; // for type "strings": each entry is a textarea
  titleKey?: string; // for type "list": which item field names the row
  rows?: number; // for type "textarea": visible rows (default 3)
  min?: number; // for type "number"
  max?: number;
  step?: number;
}

export interface FileCollection {
  id: string;
  label: string;
  kind: 'file';
  path: string;
  fields: Field[];
}
export interface PostsCollection {
  id: 'posts';
  label: string;
  kind: 'posts';
  dir: string;
}
export type Collection = FileCollection | PostsCollection;

const link: Field[] = [
  { key: 'label', label: 'Label', type: 'text' },
  { key: 'href', label: 'URL', type: 'url' },
  { key: 'pop', label: 'Pop-up joke (optional)', type: 'text', help: 'If set, clicking shows these comic bubbles instead of opening the link. Separate several with |' },
];

export const COLLECTIONS: Collection[] = [
  { id: 'posts', label: 'Blog posts', kind: 'posts', dir: 'src/content/posts' },
  {
    id: 'site',
    label: 'Profile & About',
    kind: 'file',
    path: 'src/content/site.json',
    fields: [
      { key: 'name', label: 'Full name', type: 'text' },
      { key: 'shortName', label: 'Short name (nav bar)', type: 'text' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'headline', label: 'Headline', type: 'textarea', help: 'One sentence shown under your name.' },
      { key: 'affiliation', label: 'Affiliation', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      {
        key: 'media',
        label: 'Hero media (click-through slider)',
        type: 'list',
        titleKey: 'pop',
        fields: [
          { key: 'src', label: 'File path or URL (image or video)', type: 'text', help: 'e.g. /assets/photo.png or /uploads/clip.mp4 — images can be uploaded below in Blog posts.' },
          { key: 'type', label: 'Type', type: 'select', options: ['image', 'video'] },
          { key: 'pop', label: 'Pop-up bubble text', type: 'text', help: 'Short comic-style text that pops over the media.' },
          { key: 'effect', label: 'Extra effect', type: 'select', options: ['none', 'bullet', 'camera', 'web'] },
        ],
      },
      { key: 'cvUrl', label: 'CV link', type: 'url' },
      { key: 'bio', label: 'About paragraphs', type: 'strings', multiline: true },
      { key: 'links', label: 'Profile links', type: 'list', fields: link, titleKey: 'label' },
      { key: 'interests', label: 'Research interests', type: 'strings' },
      { key: 'researchStatement', label: 'Research statement paragraphs', type: 'strings', multiline: true },
      { key: 'keywords', label: 'Scrolling keywords', type: 'strings' },
      {
        key: 'stats',
        label: 'Highlight stats',
        type: 'list',
        titleKey: 'label',
        fields: [
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'label', label: 'Label', type: 'text' },
        ],
      },
      { key: 'contactText', label: 'Contact blurb', type: 'textarea' },
    ],
  },
  {
    id: 'publications',
    label: 'Publications',
    kind: 'file',
    path: 'src/content/publications.json',
    fields: [
      {
        key: 'items',
        label: 'Publications',
        type: 'list',
        titleKey: 'title',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'authors', label: 'Authors', type: 'text' },
          { key: 'venue', label: 'Venue / details', type: 'text' },
          { key: 'year', label: 'Year', type: 'text' },
          { key: 'status', label: 'Status', type: 'select', options: ['Preprint', 'In preparation', 'Published', 'Under review'] },
          { key: 'url', label: 'Link', type: 'url' },
          { key: 'linkLabel', label: 'Link label', type: 'text' },
          { key: 'pdf', label: 'PDF link (optional)', type: 'url', help: 'arXiv papers get a PDF link automatically.' },
          { key: 'doi', label: 'DOI (optional)', type: 'text', help: 'Like 10.5281/zenodo.18761938. Picked up from the details above if it is written there as doi:...' },
          { key: 'code', label: 'Code link (optional)', type: 'url' },
          { key: 'cover', label: 'Cover image (optional)', type: 'image', help: 'A portrait picture, about 3:4, e.g. the project logo on black. Without one, a pattern is drawn from the title.' },
          { key: 'cards', label: 'Research cards', type: 'text', help: 'Numbers of the Research page cards (1 to 7, in the order they appear) this belongs under, comma separated. Leave blank to keep it off the cards.' },
          { key: 'tags', label: 'Topics (comma separated, optional)', type: 'text', help: 'Shown as small tags and as filter buttons on the Publications page.' },
          { key: 'abstract', label: 'Abstract (optional)', type: 'textarea', help: 'Adds an Abstract button to the paper. Searchable too.' },
          {
            key: 'news',
            label: 'News (optional)',
            type: 'list',
            titleKey: 'text',
            fields: [
              { key: 'date', label: 'Date (YYYY-MM-DD or YYYY-MM)', type: 'text', help: 'The newest entry is shown on the paper card; all of them are listed on the paper page.' },
              { key: 'text', label: 'What happened', type: 'text', help: 'e.g. Accepted at ..., Journal manuscript in progress, New version posted.' },
              { key: 'link', label: 'Link (optional)', type: 'url' },
              { key: 'linkLabel', label: 'Link label (optional)', type: 'text' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    kind: 'file',
    path: 'src/content/projects.json',
    fields: [
      {
        key: 'items',
        label: 'Projects',
        type: 'list',
        titleKey: 'name',
        fields: [
          { key: 'name', label: 'Name', type: 'text', help: 'The page address comes from this, e.g. kernel-borderlands becomes /projects/kernel-borderlands.' },
          { key: 'description', label: 'Short description', type: 'textarea', help: 'One or two sentences, shown on the cards and in link previews.' },
          { key: 'status', label: 'Status tag', type: 'select', options: ['', 'Active', 'Research', 'Prototype', 'Archived', 'Contribution', 'Hobby'], help: 'Leave blank for no tag.' },
          { key: 'featured', label: 'Featured', type: 'boolean', help: 'Featured projects come first, get a wider card, and are the ones shown on the home page.' },
          { key: 'date', label: 'Date (YYYY-MM, optional)', type: 'text', help: 'Used for the Newest sort.' },
          { key: 'lang', label: 'Languages (2-4, comma separated)', type: 'text' },
          { key: 'url', label: 'Repository URL', type: 'url', help: 'GitHub links also pull in stars, languages and activity at build time. Leave blank for a private repository.' },
          { key: 'cards', label: 'Research cards', type: 'text', help: 'Numbers of the Research page cards (1 to 7, in the order they appear) this belongs under, comma separated. Leave blank to keep it off the cards.' },
          { key: 'private', label: 'Private repository', type: 'boolean', help: 'Hides the repository link and shows a private tag instead.' },
          { key: 'tags', label: 'Tags', type: 'strings', help: 'Used for filtering and for linking related projects and posts.' },
          { key: 'cover', label: 'Cover image (optional)', type: 'image' },
          { key: 'logo', label: 'Logo plate (optional)', type: 'image', help: 'A portrait picture, about 3:4, usually the logo on black. Shown on the project page as an engraved metal plate that tilts with the cursor.' },
          { key: 'install', label: 'Quick start (optional)', type: 'textarea', rows: 4, help: 'Commands shown in a copyable box on the project page, one per line.' },
          { key: 'demo', label: 'Terminal replay (optional)', type: 'textarea', rows: 8, help: 'An animated terminal on the project page. Start a line with $ to have it typed as a command; any other line is printed as output; # lines are comments. Leave empty to replay the quick start instead.' },
          { key: 'body', label: 'Write-up (Markdown)', type: 'textarea', rows: 14, help: 'The long description on the project page: the problem, the approach, results. Headings, lists, links and code blocks work.' },
          {
            key: 'links',
            label: 'Extra links',
            type: 'list',
            titleKey: 'label',
            fields: [
              { key: 'label', label: 'Label', type: 'text', help: 'e.g. Paper, Docs, Demo' },
              { key: 'href', label: 'URL', type: 'url' },
            ],
          },
          { key: 'relatedPosts', label: 'Related posts (slugs)', type: 'strings', help: 'The part of the address after /blog/, e.g. hello-world. Posts that mention the project by name are found automatically.' },
        ],
      },
    ],
  },
  {
    id: 'experience',
    label: 'Education & Experience',
    kind: 'file',
    path: 'src/content/experience.json',
    fields: [
      {
        key: 'experience',
        label: 'Experience',
        type: 'list',
        titleKey: 'role',
        fields: [
          { key: 'role', label: 'Role', type: 'text' },
          { key: 'org', label: 'Organisation', type: 'text' },
          { key: 'dates', label: 'Dates', type: 'text' },
          { key: 'points', label: 'Highlights', type: 'strings', multiline: true },
        ],
      },
      {
        key: 'education',
        label: 'Education',
        type: 'list',
        titleKey: 'degree',
        fields: [
          { key: 'degree', label: 'Degree', type: 'text' },
          { key: 'school', label: 'School', type: 'text' },
          { key: 'dates', label: 'Dates', type: 'text' },
          { key: 'note', label: 'Note', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'honors',
    label: 'Honors & Certifications',
    kind: 'file',
    path: 'src/content/honors.json',
    fields: [
      {
        key: 'honors',
        label: 'Honors',
        type: 'list',
        titleKey: 'title',
        fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'detail', label: 'Detail', type: 'text' },
          { key: 'date', label: 'Date', type: 'text' },
        ],
      },
      {
        key: 'certs',
        label: 'Certifications',
        type: 'list',
        titleKey: 'name',
        fields: [
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'issuer', label: 'Issuer & year', type: 'text' },
        ],
      },
    ],
  },
  {
    id: 'skills',
    label: 'Skills',
    kind: 'file',
    path: 'src/content/skills.json',
    fields: [
      {
        key: 'groups',
        label: 'Skill groups',
        type: 'list',
        titleKey: 'label',
        fields: [
          { key: 'label', label: 'Group', type: 'text' },
          { key: 'items', label: 'Items (comma separated)', type: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'cassette',
    label: 'Cassette (music)',
    kind: 'file',
    path: 'src/content/cassette.json',
    fields: [
      { key: 'intro', label: 'Intro line', type: 'textarea', help: 'Shown at the top of the Cassette page.' },
      { key: 'favLabel', label: 'Favourite tag text', type: 'text', help: 'The tag shown in the player for songs marked as a favourite, e.g. "Peak favourite". Leave empty to show only the star in the track list.' },
      { key: 'disclaimer', label: 'Disclaimer (bottom of page)', type: 'textarea', help: 'Rights notice shown under the player. Leave empty to hide it.' },
      {
        key: 'albums',
        label: 'Albums (tapes)',
        type: 'list',
        titleKey: 'title',
        fields: [
          { key: 'title', label: 'Album title', type: 'text' },
          { key: 'artist', label: 'Artist', type: 'text' },
          { key: 'year', label: 'Year (optional)', type: 'text' },
          { key: 'cover', label: 'Tape cover (optional)', type: 'image', help: 'Shown on the cassette. Leave empty to use the first song\'s cover.' },
          { key: 'note', label: 'Why I like it (optional)', type: 'textarea' },
          {
            key: 'tracks',
            label: 'Tracks',
            type: 'list',
            titleKey: 'title',
            fields: [
              { key: 'title', label: 'Track title', type: 'text' },
              { key: 'artist', label: 'Artist (if different)', type: 'text' },
              { key: 'fav', label: 'Favourite', type: 'boolean', help: 'Adds the favourite tag (text set at the top of this section) and a star in the track list.' },
              { key: 'year', label: 'Year (optional)', type: 'text' },
              { key: 'note', label: 'Why I like it (optional)', type: 'textarea', help: 'Shown under the player controls while this song is selected.' },
              { key: 'cover', label: 'Song cover (optional)', type: 'image', help: 'Shown in the player while this song is selected.' },
              { key: 'src', label: 'Audio file', type: 'audio', help: 'MP3, M4A, AAC, OGG or WAV. Files over 3.2 MB are compressed to a smaller MP3 for you.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'special',
    label: 'Special',
    kind: 'file',
    path: 'src/content/special.json',
    fields: [
      { key: 'bgText', label: 'Background text', type: 'text', help: 'Huge, faint text behind the dot grid on every page except the main page. Leave empty to hide it.' },
      { key: 'bgTextPosition', label: 'Background text position', type: 'select', options: ['bottom-right', 'bottom-left', 'top-right', 'top-left', 'center'] },
      { key: 'showLocalTime', label: 'Footer: show your local time', type: 'boolean', help: 'A line in the footer like "It is 02:41 in Hyderabad. After midnight, probably still awake."' },
      { key: 'timeZone', label: 'Footer: time zone', type: 'text', help: 'An IANA time zone name, e.g. Asia/Kolkata or Europe/London.' },
      { key: 'maintenance', label: 'Maintenance mode', type: 'boolean', help: 'Turns the whole site into the "Back soon" (503) page for visitors. You still see the site, with a thin banner, while signed in. Remember to switch it off again.' },
      { key: 'maintenanceText', label: 'Maintenance message (optional)', type: 'textarea', help: 'Shown on the "Back soon" page. Leave empty for the default.' },
      { key: 'dotShape', label: 'Dots: shape', type: 'select', options: ['circle', 'square', 'diamond'] },
      { key: 'dotSize', label: 'Dots: size', type: 'number', min: 0.5, max: 5, step: 0.1, help: 'Resting dot width in px. Default 1.5.' },
      { key: 'dotSpacing', label: 'Dots: spacing', type: 'number', min: 12, max: 60, step: 1, help: 'Gap between dots in px. Default 26.' },
      { key: 'dotOpacity', label: 'Dots: resting opacity (%)', type: 'number', min: 2, max: 60, step: 1, help: 'How visible the dots are when the cursor is away. Default 16.' },
      { key: 'cursorEnabled', label: 'Cursor effect on', type: 'boolean', help: 'Turn the cursor depth effect off to keep a plain dot grid.' },
      { key: 'cursorRadius', label: 'Cursor: reach', type: 'number', min: 60, max: 400, step: 5, help: 'Radius of the lens around the cursor in px. Default 190.' },
      { key: 'cursorDepth', label: 'Cursor: depth strength', type: 'number', min: 0, max: 50, step: 1, help: 'How far dots are pushed outward at the cursor, in px. Default 15.' },
      { key: 'cursorGrow', label: 'Cursor: dot growth', type: 'number', min: 0, max: 8, step: 0.1, help: 'How much dots swell at the cursor, in px. Default 2.6.' },
      { key: 'cursorGlow', label: 'Cursor: glow (%)', type: 'number', min: 0, max: 40, step: 1, help: 'Strength of the soft coloured pit under the cursor. Default 10.' },
    ],
  },
  {
    id: 'news',
    label: 'Latest news',
    kind: 'file',
    path: 'src/content/news.json',
    fields: [
      {
        key: 'items',
        label: 'News items',
        type: 'list',
        titleKey: 'text',
        fields: [
          { key: 'date', label: 'Date (YYYY-MM)', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea' },
        ],
      },
    ],
  },
];
