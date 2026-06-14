class BaseAgent:
    """
    Base Agent class representing a Microsoft Agents League agent.
    Provides execution tracing, state logging, and consistent interface.
    """
    def __init__(self, name: str):
        self.name = name
        self.execution_log = []

    def log(self, message: str):
        """
        Record a step in this agent's trace.
        """
        self.execution_log.append(message)
        print(f"[{self.name}] {message}")

    def get_logs(self) -> list:
        return self.execution_log
