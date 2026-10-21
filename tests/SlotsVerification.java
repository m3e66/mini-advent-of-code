import java.util.Random;
import java.util.function.DoubleSupplier;

public class SlotsVerification {
    // Independent cell-weight reference: each cell gets a base weight plus qualifying line weights.
    static int reference(int[][] grid) {
        int result = 0;
        for (int row = 0; row < 3; row++) {
            for (int column = 0; column < 5; column++) {
                int weight = 1;
                boolean sameRow = true, sameColumn = true;
                for (int other = 0; other < 5; other++) sameRow &= grid[row][other] == grid[row][column];
                for (int other = 0; other < 3; other++) sameColumn &= grid[other][column] == grid[row][column];
                if (sameRow) weight++;
                if (sameColumn) weight++;
                result += grid[row][column] * weight;
            }
        }
        return result;
    }
    static String format(int[][] grid) {
        StringBuilder text = new StringBuilder();
        for (int[] row : grid) {
            for (int value : row) text.append(value);
            text.append('\n');
        }
        return text.toString();
    }
    static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
    }
    static DoubleSupplier script(double[] values) {
        return new DoubleSupplier() {
            int index;
            public double getAsDouble() {
                if (index >= values.length) throw new AssertionError("Unexpected random draw");
                return values[index++];
            }
        };
    }
    public static void main(String[] args) {
        check(SlotsAnswer.score("12345\n68795\n16275") == 86, "First example");
        check(SlotsAnswer.score("12345\n68795\n55555") == 115, "Overlapping example");
        check(SlotsAnswer.score("99999\n99999\n99999") == 405, "All matching");
        check(SlotsAnswer.score("00000\n00000\n00000") == 0, "Zero score");
        for (int mask = 0; mask < (1 << 15); mask++) {
            int[][] grid = new int[3][5];
            for (int cell = 0; cell < 15; cell++) grid[cell / 5][cell % 5] = (mask >> cell) & 1;
            check(SlotsAnswer.score(format(grid)) == reference(grid), "Binary grid " + mask);
        }
        // Enumerate both pattern selectors and both second-value branches, including selector 3.
        for (int first = 0; first < 8; first++) {
            for (int second = 0; second < 8; second++) {
                for (int reuse = 0; reuse < 2; reuse++) {
                    double[] draws = new double[reuse == 0 ? 20 : 21];
                    for (int i = 0; i < 15; i++) draws[i] = ((i % 10) + 0.1) / 10;
                    draws[15] = (first + 0.1) / 8;
                    draws[16] = .7;
                    draws[17] = .9;
                    draws[18] = (second + .1) / 8;
                    draws[19] = reuse == 0 ? .1 : .9;
                    if (reuse == 1) draws[20] = .4;
                    int[][] grid = InputGen.generate(script(draws));
                    int value = reuse == 0 ? 7 : 4;
                    if (second < 3) for (int digit : grid[second]) check(digit == value, "Second row");
                    else for (int[] row : grid) check(row[second - 3] == value, "Second column");
                    check(SlotsAnswer.score(format(grid)) == reference(grid), "Pattern combination");
                }
            }
        }
        Random random = new Random(777);
        for (int i = 0; i < 1000; i++) {
            int[][] grid = InputGen.generate(random::nextDouble);
            check(SlotsAnswer.score(format(grid)) == reference(grid), "Random generated input");
        }
        for (String invalid : new String[]{"", "12345\n12345", "1234x\n12345\n12345", "12345\n12345\n12345\n12345"}) {
            try { SlotsAnswer.score(invalid); throw new AssertionError("Malformed input accepted"); }
            catch (IllegalArgumentException expected) { }
        }
        System.out.println("Java verification passed: examples, 32,768 binary grids, 128 pattern combinations, 1,000 generated inputs, and invalid inputs.");
    }
}
