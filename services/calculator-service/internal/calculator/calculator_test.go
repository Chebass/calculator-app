package calculator

import (
	"errors"
	"math"
	"testing"
)

func ptr(f float64) *float64 { return &f }

func TestCalculate(t *testing.T) {
	tests := []struct {
		name string
		op   Operation
		a    float64
		b    *float64
		want float64
	}{
		{"add", Add, 2, ptr(3), 5},
		{"add negatives", Add, -2, ptr(-3), -5},
		{"add decimals", Add, 1.5, ptr(2.25), 3.75},
		{"subtract", Subtract, 10, ptr(4), 6},
		{"subtract to negative", Subtract, 4, ptr(10), -6},
		{"multiply", Multiply, 6, ptr(7), 42},
		{"multiply by zero", Multiply, 6, ptr(0), 0},
		{"divide", Divide, 9, ptr(3), 3},
		{"divide fraction", Divide, 1, ptr(4), 0.25},
		{"zero divided", Divide, 0, ptr(5), 0},
		{"power", Power, 2, ptr(10), 1024},
		{"power zero exponent", Power, 5, ptr(0), 1},
		{"power negative exponent", Power, 2, ptr(-1), 0.5},
		{"sqrt", Sqrt, 144, nil, 12},
		{"sqrt zero", Sqrt, 0, nil, 0},
		{"percentage", Percentage, 18, ptr(1250), 225},
		{"percentage of zero", Percentage, 50, ptr(0), 0},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Calculate(tc.op, tc.a, tc.b)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if math.Abs(got-tc.want) > 1e-9 {
				t.Errorf("got %v, want %v", got, tc.want)
			}
		})
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		name string
		op   Operation
		a    float64
		b    *float64
		want error
	}{
		{"unknown operation", Operation("modulo"), 1, ptr(2), ErrUnknownOperation},
		{"empty operation", Operation(""), 1, ptr(2), ErrUnknownOperation},
		{"binary without b", Add, 1, nil, ErrMissingOperand},
		{"unary with b", Sqrt, 4, ptr(2), ErrUnexpectedOperand},
		{"divide by zero", Divide, 1, ptr(0), ErrDivisionByZero},
		{"divide by negative zero", Divide, 1, ptr(math.Copysign(0, -1)), ErrDivisionByZero},
		{"sqrt negative", Sqrt, -1, nil, ErrNegativeSqrt},
		{"overflow multiply", Multiply, math.MaxFloat64, ptr(10), ErrUndefinedResult},
		{"overflow add", Add, math.MaxFloat64, ptr(math.MaxFloat64), ErrUndefinedResult},
		{"power overflow", Power, 10, ptr(400), ErrUndefinedResult},
		{"zero to negative power", Power, 0, ptr(-1), ErrUndefinedResult},
		{"negative base fractional exponent", Power, -8, ptr(0.5), ErrUndefinedResult},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			_, err := Calculate(tc.op, tc.a, tc.b)
			if !errors.Is(err, tc.want) {
				t.Errorf("got error %v, want %v", err, tc.want)
			}
		})
	}
}

func TestSpecs(t *testing.T) {
	got := Specs()
	if len(got) != 7 {
		t.Fatalf("expected 7 operations, got %d", len(got))
	}
	// Mutating the returned slice must not affect the package state.
	got[0].Name = "hacked"
	if Specs()[0].Name != Add {
		t.Error("Specs must return a copy")
	}
	for _, s := range Specs() {
		if s.Arity != 1 && s.Arity != 2 {
			t.Errorf("%s has invalid arity %d", s.Name, s.Arity)
		}
	}
}
