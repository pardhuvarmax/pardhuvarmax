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
          { key: 'name', label: 'Name', type: 'text' },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'lang', label: 'Languages (2-4, comma separated)', type: 'text' },
          { key: 'url', label: 'Repository URL', type: 'url' },
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
              { key: 'fav', label: 'Peak favourite', type: 'boolean', help: 'Adds a "Peak favourite" tag and a star in the track list.' },
              { key: 'year', label: 'Year (optional)', type: 'text' },
              { key: 'note', label: 'Why I like it (optional)', type: 'textarea', help: 'Shown under the player controls while this song is selected.' },
              { key: 'cover', label: 'Song cover (optional)', type: 'image', help: 'Shown in the player while this song is selected.' },
              { key: 'src', label: 'Audio file', type: 'audio', help: 'MP3, M4A, AAC, OGG or WAV, up to 3.2 MB each (a 128 kbps MP3 is about 1 MB per minute).' },
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
