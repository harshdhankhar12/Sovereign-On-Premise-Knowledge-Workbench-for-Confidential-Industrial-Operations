from typing import Dict, Any, Optional
from langgraph.graph import StateGraph, START, END
from sqlalchemy.ext.asyncio import AsyncSession
from server.agent.state import AgentState
from server.agent.nodes import (
    intent_node,
    retrieval_node,
    sandbox_node,
    verifier_node,
    synthesis_node,
)
from server.core.llm import OllamaChatService
from server.retrieval.vector_store import VectorSearchService

class SovereignAgentWorkflow:
    def __init__(
        self,
        llm_service: Optional[OllamaChatService] = None,
        search_service: Optional[VectorSearchService] = None,
    ):
        self.llm = llm_service or OllamaChatService()
        self.search = search_service or VectorSearchService()

    def build_graph(self, session: AsyncSession):
        graph = StateGraph(AgentState)

        async def _intent(state: AgentState):
            return await intent_node(state, self.llm)

        async def _retrieval(state: AgentState):
            return await retrieval_node(state, self.search, session)

        async def _sandbox(state: AgentState):
            return await sandbox_node(state)

        async def _verifier(state: AgentState):
            return await verifier_node(state)

        async def _synthesis(state: AgentState):
            return await synthesis_node(state, self.llm)

        graph.add_node("intent", _intent)
        graph.add_node("retrieval", _retrieval)
        graph.add_node("sandbox", _sandbox)
        graph.add_node("verifier", _verifier)
        graph.add_node("synthesis", _synthesis)

        def route_after_intent(state: AgentState):
            if state.get("intent") == "CALCULATION":
                return "sandbox"
            return "retrieval"

        def route_after_retrieval(state: AgentState):
            if state.get("formula_name") and state.get("formula_params"):
                return "sandbox"
            return "synthesis"

        graph.add_edge(START, "intent")
        graph.add_conditional_edges("intent", route_after_intent, ["sandbox", "retrieval"])
        graph.add_conditional_edges("retrieval", route_after_retrieval, ["sandbox", "synthesis"])
        graph.add_edge("sandbox", "verifier")
        graph.add_edge("verifier", "synthesis")
        graph.add_edge("synthesis", END)

        return graph.compile()

    async def execute(
        self,
        prompt: str,
        session: AsyncSession,
        task_id: Optional[str] = None,
        plant_unit: Optional[str] = None,
        doc_type: Optional[str] = None,
        user_id: str = "engineer",
        top_k: int = 4,
        formula_params: Optional[Dict[str, Any]] = None,
        claimed_value: Optional[float] = None,
    ) -> AgentState:
        initial_state: AgentState = {
            "task_id": task_id,
            "user_id": user_id,
            "prompt": prompt,
            "plant_unit": plant_unit,
            "doc_type": doc_type,
            "top_k": top_k,
            "intent": "SOP_QUERY",
            "retrieved_chunks": [],
            "citations": [],
            "formula_name": None,
            "formula_params": formula_params,
            "claimed_value": claimed_value,
            "sandbox_output": None,
            "verification_passed": None,
            "final_response": "",
            "steps": [],
        }

        compiled_app = self.build_graph(session)
        final_state = await compiled_app.ainvoke(initial_state)
        return final_state

agent_workflow = SovereignAgentWorkflow()
