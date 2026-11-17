// Package calculator contains the pure arithmetic domain logic.
// It knows nothing about HTTP or JSON, which keeps it trivial to test.
package calculator

import (
	"errors"
	"fmt"
	"math"
)

// Operation identifies a supported arithmetic operation.
type Operation string

// Supported operations.
const (
	Add        Operation = "add"
	Subtract   Operation = "subtract"
	Multiply   Operation = "multiply"
	Divide     Operation = "divide"
	Power      Operation = "power"
	Sqrt       Operation = "sqrt"
	Percentage Operation = "percentage"
)

// Domain errors. Callers use errors.Is to map them to transport-level codes.
var (
	ErrUnknownOperation  = errors.New("unknown operation")
	ErrMissingOperand    = errors.New("missing operand")
	ErrUnexpectedOperand = errors.New("unexpected operand")
	ErrDivisionByZero    = errors.New("division by zero")
	ErrNegativeSqrt      = errors.New("square root of a negative number")
	ErrUndefinedResult   = errors.New("result is undefined or not representable")
)

// Spec describes an operation for discovery by clients.
type Spec struct {
	Name        Operation `json:"name"`
	Symbol      string    `json:"symbol"`
	Arity       int       `json:"arity"`
	Description string    `json:"description"`
}

var specs = []Spec{
	{Add, "+", 2, "a + b"},
	{Subtract, "-", 2, "a - b"},
	{Multiply, "×", 2, "a × b"},
	{Divide, "÷", 2, "a ÷ b (b must not be 0)"},
	{Power, "^", 2, "a raised to the power b"},
	{Sqrt, "√", 1, "square root of a (a must not be negative)"},
	{Percentage, "%", 2, "a percent of b"},
}

// Specs returns the supported operations in display order.
func Specs() []Spec {
	out := make([]Spec, len(specs))
	copy(out, specs)
	return out
}

func specFor(op Operation) (Spec, bool) {
	for _, s := range specs {
		if s.Name == op {
			return s, true
		}
	}
	return Spec{}, false
}

// Calculate applies op to a and, for binary operations, b.
// Unary operations (sqrt) require b to be nil; binary operations require it.
func Calculate(op Operation, a float64, b *float64) (float64, error) {
	spec, ok := specFor(op)
	if !ok {
		return 0, fmt.Errorf("%w: %q", ErrUnknownOperation, op)
	}
	if spec.Arity == 2 && b == nil {
		return 0, fmt.Errorf("%w: %q requires operand b", ErrMissingOperand, op)
	}
	if spec.Arity == 1 && b != nil {
		return 0, fmt.Errorf("%w: %q takes a single operand", ErrUnexpectedOperand, op)
	}

	var result float64
	switch op {
	case Add:
		result = a + *b
	case Subtract:
		result = a - *b
	case Multiply:
		result = a * *b
	case Divide:
		if *b == 0 {
			return 0, ErrDivisionByZero
		}
		result = a / *b
	case Power:
		result = math.Pow(a, *b)
	case Sqrt:
		if a < 0 {
			return 0, ErrNegativeSqrt
		}
		result = math.Sqrt(a)
	case Percentage:
		result = a * *b / 100
	}

	if math.IsNaN(result) || math.IsInf(result, 0) {
		return 0, ErrUndefinedResult
	}
	return result, nil
}
