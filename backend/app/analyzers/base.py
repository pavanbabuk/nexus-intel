from abc import ABC, abstractmethod
from typing import List
from app.models.schemas import TargetType, AnalyzerInfo
from app.core.graph import GraphManager

class BaseAnalyzer(ABC):
    """Abstract base class for all OSINT analyzers in NexusIntel."""

    id: str = "base_analyzer"
    name: str = "Base Analyzer"
    description: str = "Abstract analyzer interface"
    supported_targets: List[TargetType] = []
    is_passive: bool = True
    requires_auth: bool = False

    def info(self) -> AnalyzerInfo:
        return AnalyzerInfo(
            id=self.id,
            name=self.name,
            description=self.description,
            supported_targets=self.supported_targets,
            is_passive=self.is_passive,
            requires_auth=self.requires_auth
        )

    def can_handle(self, target_type: TargetType) -> bool:
        return target_type in self.supported_targets

    @abstractmethod
    async def run(self, target: str, target_type: TargetType, graph: GraphManager) -> None:
        """Execute the analyzer and enrich the graph."""
        pass
