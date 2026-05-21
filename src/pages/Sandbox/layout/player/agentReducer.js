/**
 * agentReducer.js
 * A stateless pure reducer to manage the AI Agent thread history and infer UI state.
 * Grounded on 12-Factor Agents Principles (Factor 5: Unify execution and business state, Factor 12: Stateless reducer).
 */

export const INITIAL_STATE = {
  events: [], // Array of event objects representing the full conversation/action history
  isProcessing: false,
  activeTask: null, // 'transcribe' | 'translate' | 'summarize' | 'chat' | etc.
  pendingApproval: null, // { toolName, args, eventId } if waiting for human approval
  currentThoughts: null, // Current thought process string
  error: null,
};

/**
 * Reducer function to transition state based on incoming events.
 * Since this is a pure function, it is easily serializable and testable.
 * 
 * Event Types:
 * - 'RESTORE_THREAD': Load cached thread events from storage.
 * - 'USER_MESSAGE': User sent a chat message.
 * - 'AGENT_THOUGHT': Agent is thinking about the next step.
 * - 'TOOL_CALL': Agent selected a tool to run (sync or async).
 * - 'TOOL_SUCCESS': Tool completed execution successfully.
 * - 'TOOL_ERROR': Tool execution failed with an error.
 * - 'ASK_APPROVAL': Agent requests human confirmation for a sensitive action.
 * - 'APPROVE_TOOL': Human approved the pending tool.
 * - 'REJECT_TOOL': Human rejected the pending tool.
 * - 'SET_ERROR': Set a global error (e.g. auth issue).
 * - 'CLEAR_HISTORY': Clear all events and reset to initial state.
 */
export function agentReducer(state, action) {
  let updatedEvents = [...state.events];

  switch (action.type) {
    case "RESTORE_THREAD": {
      const restoredEvents = action.payload || [];
      const newState = { ...INITIAL_STATE, events: restoredEvents };
      return recomputeDerivedState(newState);
    }

    case "USER_MESSAGE": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "user",
        text: action.payload.text,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: true,
        activeTask: "chat",
        error: null,
      });
    }

    case "AGENT_THOUGHT": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "thought",
        text: action.payload.text,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        currentThoughts: action.payload.text,
      });
    }

    case "AGENT_MESSAGE": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "agent",
        text: action.payload.text,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: false,
        activeTask: null,
      });
    }

    case "TOOL_CALL": {
      const newEvent = {
        id: action.payload.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "tool_call",
        name: action.payload.name,
        args: action.payload.args || {},
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: true,
        activeTask: action.payload.name,
      });
    }

    case "TOOL_SUCCESS": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "tool_result",
        name: action.payload.name,
        result: action.payload.result,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: false,
        activeTask: null,
      });
    }

    case "TOOL_ERROR": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "tool_error",
        name: action.payload.name,
        error: action.payload.error,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: false,
        activeTask: null,
        error: action.payload.error,
      });
    }

    case "ASK_APPROVAL": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "ask_approval",
        toolName: action.payload.toolName,
        args: action.payload.args || {},
        reason: action.payload.reason,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        isProcessing: false, // Paused, waiting for human
        pendingApproval: {
          eventId: newEvent.id,
          toolName: action.payload.toolName,
          args: action.payload.args,
          reason: action.payload.reason,
        },
      });
    }

    case "APPROVE_TOOL": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "human_decision",
        decision: "approved",
        targetEventId: action.payload.eventId,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        pendingApproval: null,
        isProcessing: true,
      });
    }

    case "REJECT_TOOL": {
      const newEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "human_decision",
        decision: "rejected",
        targetEventId: action.payload.eventId,
        timestamp: Date.now(),
      };
      updatedEvents.push(newEvent);
      return recomputeDerivedState({
        ...state,
        events: updatedEvents,
        pendingApproval: null,
        isProcessing: false,
      });
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: action.payload,
        isProcessing: false,
        activeTask: null,
      };
    }

    case "CLEAR_HISTORY": {
      return INITIAL_STATE;
    }

    default:
      return state;
  }
}

/**
 * Helper to compute UI derived states from the chronological event history.
 * Ensures the thread history serves as the single source of truth (Factor 5).
 */
function recomputeDerivedState(state) {
  const events = state.events;
  if (events.length === 0) {
    return { ...INITIAL_STATE };
  }

  let isProcessing = false;
  let activeTask = null;
  let pendingApproval = null;
  let currentThoughts = null;
  let error = null;

  // Scan events forward to construct current state representation
  for (let i = 0; i < events.length; i++) {
    const evt = events[i];
    switch (evt.type) {
      case "user":
        isProcessing = true;
        activeTask = "chat";
        currentThoughts = null;
        error = null;
        break;

      case "agent":
        isProcessing = false;
        activeTask = null;
        currentThoughts = null;
        break;

      case "thought":
        currentThoughts = evt.text;
        break;

      case "tool_call":
        isProcessing = true;
        activeTask = evt.name;
        break;

      case "tool_result":
        isProcessing = false;
        activeTask = null;
        currentThoughts = null;
        break;

      case "tool_error":
        isProcessing = false;
        activeTask = null;
        error = evt.error;
        currentThoughts = null;
        break;

      case "ask_approval":
        isProcessing = false;
        pendingApproval = {
          eventId: evt.id,
          toolName: evt.toolName,
          args: evt.args,
          reason: evt.reason,
        };
        break;

      case "human_decision":
        if (evt.decision === "approved") {
          isProcessing = true;
          // Target tool will be re-triggered by control loop
        } else {
          isProcessing = false;
        }
        pendingApproval = null;
        break;
    }
  }

  return {
    events,
    isProcessing,
    activeTask,
    pendingApproval,
    currentThoughts,
    error: error || state.error, // preserve global state errors if any
  };
}
