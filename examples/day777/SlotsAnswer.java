import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/** Supplied scoring algorithm, with explicit input validation and file errors. */
public class SlotsAnswer {
    public static int score(String input) {
        String[] rows = input.strip().split("\\R");
        if (rows.length != 3) throw new IllegalArgumentException("Expected three rows of five digits.");
        int[][] grid = new int[3][5];
        for (int row = 0; row < 3; row++) {
            if (!rows[row].matches("[0-9]{5}")) throw new IllegalArgumentException("Expected three rows of five digits.");
            for (int column = 0; column < 5; column++) grid[row][column] = rows[row].charAt(column) - '0';
        }
        int score = 0;
        for (int[] row : grid) for (int value : row) score += value;
        for (int row = 0; row < 3; row++) {
            if (grid[row][0] == grid[row][1] && grid[row][1] == grid[row][2]
                    && grid[row][2] == grid[row][3] && grid[row][3] == grid[row][4]) {
                score += grid[row][1] * 5;
            }
        }
        for (int column = 0; column < 5; column++) {
            if (grid[0][column] == grid[1][column] && grid[1][column] == grid[2][column]) {
                score += grid[0][column] * 3;
            }
        }
        return score;
    }

    public static void main(String[] args) {
        try {
            Path inputPath = Path.of(args.length == 0 ? "src/data" : args[0]);
            System.out.println(score(Files.readString(inputPath)));
        } catch (IOException | IllegalArgumentException error) {
            System.err.println("Could not score input: " + error.getMessage());
            System.exit(1);
        }
    }
}
