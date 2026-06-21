/**
 * Builds a single VCF (vCard 3.0) file string from an array of contacts.
 * Each contact becomes one BEGIN:VCARD ... END:VCARD block.
 */
export function buildVcf(contacts, emojiPrefix = '') {
  const prefix = emojiPrefix ? emojiPrefix.trim() + ' ' : '';

  const blocks = contacts.map((c) => {
    const name = `${prefix}${c.name}`;
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVcfValue(name)}`,
      `TEL;TYPE=CELL:${c.phone}`,
    ];
    if (c.email) {
      lines.push(`EMAIL:${escapeVcfValue(c.email)}`);
    }
    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  return blocks.join('\r\n');
}

/**
 * Escapes characters that have special meaning in VCF text values.
 */
function escapeVcfValue(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates a safe filename for the exported VCF.
 */
export function vcfFilename(sessionTitle) {
  const slug = sessionTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${slug || 'cymorvcf'}-${Date.now()}.vcf`;
}
