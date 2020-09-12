# Text State Machine
*Build and walk probabilistic state machines from a body of text. Allows export/import of states and probabilities.*

## Why
I didn't think existing implementations were slow enough.

## Using
First install the package using `npm install _____`

Then, import the package
```typescript
import { TextStateMachine } from 'text-state-machine';

const trainingText = "your body of training text goes here";

const machine = new TextStateMachine(trainingText);

machine.next(); // will generate a single word

machine.sentence(30); // will generate a string of 30 space-seperated words

const states = machine.export(); // will export states and probabilities in JSON format

const newMachine = new TextStateMachine();
newMachine.import(states); // hydrates a new state machine from a previous JSON export

```

## Building
```bash
npm i
npm run build
```
