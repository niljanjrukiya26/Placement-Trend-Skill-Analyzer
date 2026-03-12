export const getUniqueDomains = (filteredRoles = []) => {
  const domainCountMap = new Map();

  filteredRoles.forEach((role) => {
    const domain = typeof role.domain === 'string' ? role.domain.trim() : '';
    if (!domain) return;

    domainCountMap.set(domain, (domainCountMap.get(domain) || 0) + 1);
  });

  return Array.from(domainCountMap.entries())
    .map(([domain, roleCount]) => ({ domain, roleCount }))
    .sort((a, b) => a.domain.localeCompare(b.domain));
};
