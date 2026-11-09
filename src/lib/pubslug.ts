// The address of a paper: its title cut to the first eight words. Shared by the site and the build step so the two always agree.
export const pubSlug = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').split('-').slice(0, 8).join('-')
