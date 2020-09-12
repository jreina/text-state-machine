interface TextNodeStats {
  count: number;
  probability: number;
}

interface BaseTextNodeStats {
  totalCount: number;
  edges: Map<string, TextNodeStats>;
}

interface BaseNodeExport {
  totalCount: number;
  edges: Record<string, TextNodeStats>;
}

type StatesExport = Record<string, BaseNodeExport>;

export class TextStateMachine {
  private _states: Map<string, BaseTextNodeStats> = new Map();
  private _current?: string;

  constructor(private _text?: string, private _wordPredicate: (word: string) => boolean = (x: string) => true) {
    if (_text !== undefined && typeof _text === "string") {
      this._parseText();
      this._calculateProbabilities();
    }
  }
  /**
   * Look away.
   */
  public next() {
    if (this._current) {
      const node = this._states.get(this._current) as BaseTextNodeStats;
      const edges = [...node.edges.entries()].sort(([, { probability: a }], [, { probability: b }]) => a - b);

      if (edges.length === 0) {
        this._current = this._findRandomNode();
        return this._current;
      }
      if (edges.length === 1) {
        this._current = edges[0][0];
        return this._current;
      }
      const rand = Math.random();
      let runningTotal = 0;
      edges.forEach(([, stats]) => {
        runningTotal += stats.probability;
        if (runningTotal > 1) runningTotal = 1;
        stats.probability = runningTotal;
      });
      const pick = edges.find(([, { probability }], i) => {
        return probability === 1 || (rand > probability && rand < edges[i + 1][1].probability);
      }) as [string, TextNodeStats];

      this._current = pick[0] || this._findRandomNode();
    } else {
      this._current = this._findRandomNode();
    }
    return this._current;
  }

  /**
   * Export states and probability values as JSON.
   */
  public export() {
    const obj = [...this._states.entries()].reduce<StatesExport>((memo, [baseKey, lefa]) => {
      memo[baseKey] = {
        totalCount: lefa.totalCount,
        edges: [...lefa.edges.entries()].reduce<Record<string, TextNodeStats>>((edge, [edgeKey, node]) => {
          edge[edgeKey] = node;
          return edge;
        }, {}),
      };
      return memo;
    }, {});
    return JSON.stringify(obj);
  }

  /**
   * Import states and probability values from a previous JSON export.
   */
  public import(states: string) {
    try {
      const obj: StatesExport = JSON.parse(states);
      Object.entries(obj).forEach(([root, node]) => {
        const edges = Object.entries(node.edges).reduce(
          (memo, [k, stats]) => memo.set(k, stats),
          new Map<string, TextNodeStats>()
        );

        this._states.set(root, {
          totalCount: node.totalCount,
          edges,
        });
      });
    } catch (err) {
      throw new Error("Error parsing states:" + err.message);
    }
  }

  /**
   * Generate a string of `length` words by walking the machine
   * @param length number of words to generate
   */
  public sentence(length: number) {
    return Array(length)
      .fill(0)
      .map((_) => this.next())
      .join(' ')
      .replace(/^(.)/, (str) => str.toUpperCase());
  }

  private _parseText() {
    if(this._text === undefined) return;
    const words = this._text.split(" ").filter(Boolean).filter(this._wordPredicate);

    words.forEach((val, i) => {
      const nextWord = words[i + 1];
      if (!this._states.has(val)) this._states.set(val, { totalCount: 0, edges: new Map() });
      const wordTransitions = this._states.get(val) as BaseTextNodeStats;
      wordTransitions.totalCount++;
      if (!wordTransitions.edges.has(nextWord)) {
        wordTransitions.edges.set(nextWord, { count: 1, probability: 0 });
      } else {
        const lefa = wordTransitions.edges.get(nextWord) as TextNodeStats;
        lefa.count++;
      }
    });
  }

  private _calculateProbabilities() {
    const words = [...this._states.entries()].forEach(([word, next]) => {
      [...next.edges.entries()].forEach(([nextWord, stats]) => {
        stats.probability = stats.count / next.totalCount;
      });
    });
  }

  private _findRandomNode() {
    const index = Math.floor(this._states.size * Math.random());
    return [...this._states.keys()][index];
  }
}
