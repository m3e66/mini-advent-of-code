import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;

public class PowerplantVerification {
    public static void main(String[] args) throws Exception {
        int[][] board = new int[25][25];
        for (int[] row : board) Arrays.fill(row, -1);
        board[0][0] = 100; board[0][1] = 100; board[1][0] = 100;
        board[11][12] = 0; board[12][11] = 0; board[13][12] = 0;
        int[][] next = Main.simulation(board);
        if (next[0][0] != 100 || next[1][1] != 100 || next[12][12] != -1 || board[1][1] != -1) {
            throw new AssertionError("Age cap, blocked machine, or simultaneous update failed");
        }
        for (String line : Files.readAllLines(Path.of(args[0]))) {
            if (!line.isBlank()) System.out.println(Main.energy(Main.parse(line)));
        }
    }
}
