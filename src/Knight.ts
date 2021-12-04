///<reference path="Piece.ts" />
class Knight extends Piece
{
    constructor(x:number, y:number, isWhite:boolean, board:Board)
    {
        super(x, y, isWhite, 3, board);
    }

    public GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}): { x: number; y: number; }[]
    {
        let ret:{ x: number; y: number; }[] = [];

        let possiblePositions = 
        [
            {x: this.X - 2, y: this.Y - 1 },
            {x: this.X - 1, y: this.Y - 2 },
            {x: this.X + 1, y: this.Y - 2 },
            {x: this.X + 2, y: this.Y - 1 },
            {x: this.X + 2, y: this.Y + 1 },
            {x: this.X + 1, y: this.Y + 2 },
            {x: this.X - 1, y: this.Y + 2 },
            {x: this.X - 2, y: this.Y + 1 },
        ];

        for(let pos of possiblePositions)
        {
            if(pos.x < 0 || pos.x > 7 || pos.y < 0 || pos.y > 7) continue;

            if((pos.x) in pieces[pos.y] && pieces[pos.y][pos.x].IsWhite == this.IsWhite)
                continue;

            ret.push({x:pos.x, y:pos.y});
        }

        return ret;
    }

    public Clone(): Piece
    {
        return new Knight(this.X, this.Y, this.IsWhite, this.Board);
    }
}