import ast
from typing import Set

class SecurityViolationError(Exception):
    pass

class CodeSecurityChecker(ast.NodeVisitor):
    FORBIDDEN_MODULES: Set[str] = {
        "os",
        "sys",
        "subprocess",
        "socket",
        "http",
        "urllib",
        "requests",
        "httpx",
        "shutil",
        "ftplib",
        "poplib",
        "smtplib",
        "telnetlib",
        "webbrowser",
        "ctypes",
        "builtins",
        "importlib",
        "pickle",
        "shelve",
        "pty",
        "commands",
        "posix",
    }

    FORBIDDEN_CALLS: Set[str] = {
        "eval",
        "exec",
        "compile",
        "__import__",
        "globals",
        "locals",
        "vars",
        "getattr",
        "setattr",
        "delattr",
        "open",
    }

    FORBIDDEN_ATTRIBUTES: Set[str] = {
        "__subclasses__",
        "__bases__",
        "__mro__",
        "__class__",
        "__code__",
        "__globals__",
    }

    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            base_module = alias.name.split(".")[0]
            if base_module in self.FORBIDDEN_MODULES:
                raise SecurityViolationError(
                    f"Security violation: import of restricted module '{alias.name}' is prohibited."
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            base_module = node.module.split(".")[0]
            if base_module in self.FORBIDDEN_MODULES:
                raise SecurityViolationError(
                    f"Security violation: from-import of restricted module '{node.module}' is prohibited."
                )
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        if isinstance(node.func, ast.Name):
            if node.func.id in self.FORBIDDEN_CALLS:
                raise SecurityViolationError(
                    f"Security violation: call to restricted function '{node.func.id}' is prohibited."
                )
        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        if node.attr in self.FORBIDDEN_ATTRIBUTES:
            raise SecurityViolationError(
                f"Security violation: access to internal attribute '{node.attr}' is prohibited."
            )
        self.generic_visit(node)

def validate_code_safety(code: str) -> None:
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise SyntaxError(f"Syntax error in script: {e.msg} (line {e.lineno})")

    checker = CodeSecurityChecker()
    checker.visit(tree)

