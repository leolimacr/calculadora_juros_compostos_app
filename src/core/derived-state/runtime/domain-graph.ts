export interface DependencyGraphNode {
  domain: string;
  dependsOn: string[];
}

export class DependencyGraph {
  private nodes: Map<string, string[]> = new Map();

  addDependency(domain: string, dependencies: string[]) {
    this.nodes.set(domain, dependencies);
  }

  getTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const stack: string[] = [];

    const visit = (domain: string) => {
      if (visited.has(domain)) return;
      visited.add(domain);
      (this.nodes.get(domain) || []).forEach(visit);
      stack.push(domain);
    };

    Array.from(this.nodes.keys()).forEach(visit);
    return stack;
  }
}

export const domainGraph = new DependencyGraph();
