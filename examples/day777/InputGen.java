import java.util.function.DoubleSupplier;

/** Corrected version of Justin and Muntasir's input generator. */
public class InputGen {
    public static int[][] generate(DoubleSupplier random) {
        int[][] grid = new int[3][5];
        for (int row = 0; row < 3; row++) {
            for (int column = 0; column < 5; column++) {
                grid[row][column] = (int) (random.getAsDouble() * 10);
            }
        }
        int pattern = (int) (random.getAsDouble() * 8);
        int firstValue = (int) (random.getAsDouble() * 10);
        applyPattern(grid, pattern, firstValue);

        if ((int) (random.getAsDouble() * 10) >= 5) {
            pattern = (int) (random.getAsDouble() * 8);
            int value = (int) (random.getAsDouble() * 10) < 5
                    ? firstValue : (int) (random.getAsDouble() * 10);
            applyPattern(grid, pattern, value);
        }
        return grid;
    }

    private static void applyPattern(int[][] grid, int pattern, int value) {
        // Selectors 0..2 are rows; 3..7 are columns. Row 3 does not exist.
        if (pattern < 3) {
            for (int column = 0; column < 5; column++) grid[pattern][column] = value;
        } else {
            int column = pattern - 3;
            for (int row = 0; row < 3; row++) grid[row][column] = value;
        }
    }

    public static void main(String[] args) {
        for (int[] row : generate(Math::random)) {
            for (int value : row) System.out.print(value);
            System.out.println();
        }
    }
}
