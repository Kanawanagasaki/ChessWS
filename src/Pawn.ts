///<reference path="Piece.ts" />
class Pawn extends Piece
{
    constructor(x:number, y:number, isWhite:boolean, board:Board)
    {
        super(x, y, isWhite, 5, board);
    }

    public GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}): { x: number; y: number; }[]
    {
        let ret:{ x: number; y: number; }[] = [];
        if(this.IsWhite && this.Y >= 7) return ret;
        else if(!this.IsWhite && this.Y <= 0) return ret;

        let canMoveForward = true;
        if(this.IsWhite && this.X in pieces[this.Y + 1]) canMoveForward = false;
        if(!this.IsWhite && this.X in pieces[this.Y - 1]) canMoveForward = false;

        if(canMoveForward)
        {
            ret.push({ x: this.X, y: this.IsWhite ? this.Y + 1 : this.Y - 1});
            if(this.IsWhite && this.Y == 1 && !(this.X in pieces[3]))
                ret.push({ x: this.X, y: 3 });
            else if(!this.IsWhite && this.Y == 6 && !(this.X in pieces[4]))
                ret.push({ x: this.X, y: 4 });
        }

        if(this.IsWhite)
        {
            if(Board.GetPieceColorAt(pieces, this.X + 1, this.Y + 1) == "black")
                ret.push({ x: this.X + 1, y: this.Y + 1 });
            if(Board.GetPieceColorAt(pieces, this.X - 1, this.Y + 1) == "black")
                ret.push({ x: this.X - 1, y: this.Y + 1 });

            if(this.Y == 4)
            {
                if(Board.GetPieceColorAt(pieces, this.X + 1, 4) == "black" &&
                    this.Board.LastPieceMoved == pieces[4][this.X + 1] &&
                    pieces[4][this.X + 1] instanceof Pawn &&
                    pieces[4][this.X + 1].PrevX == pieces[4][this.X + 1].X &&
                    pieces[4][this.X + 1].PrevY == 6)
                    ret.push({ x: this.X + 1, y: this.Y + 1 });
                if(Board.GetPieceColorAt(pieces, this.X - 1, 4) == "black" &&
                    this.Board.LastPieceMoved == pieces[4][this.X - 1] &&
                    pieces[4][this.X - 1] instanceof Pawn &&
                    pieces[4][this.X - 1].PrevX == pieces[4][this.X - 1].X &&
                    pieces[4][this.X - 1].PrevY == 6)
                    ret.push({ x: this.X - 1, y: this.Y + 1 });
            }
        }
        else
        {
            if(Board.GetPieceColorAt(pieces, this.X + 1, this.Y - 1) == "white")
                ret.push({ x: this.X + 1, y: this.Y - 1 });
            if(Board.GetPieceColorAt(pieces, this.X - 1, this.Y - 1) == "white")
                ret.push({ x: this.X - 1, y: this.Y - 1 });

            if(this.Y == 3)
            {
                if(Board.GetPieceColorAt(pieces, this.X + 1, 3) == "white" &&
                    this.Board.LastPieceMoved == pieces[3][this.X + 1] &&
                    pieces[3][this.X + 1] instanceof Pawn &&
                    pieces[3][this.X + 1].PrevX == pieces[3][this.X + 1].X &&
                    pieces[3][this.X + 1].PrevY == 1)
                    ret.push({ x: this.X + 1, y: this.Y - 1 });
                if(Board.GetPieceColorAt(pieces, this.X - 1, 3) == "white" &&
                    this.Board.LastPieceMoved == pieces[3][this.X - 1] &&
                    pieces[3][this.X - 1] instanceof Pawn &&
                    pieces[3][this.X - 1].PrevX == pieces[3][this.X - 1].X &&
                    pieces[3][this.X - 1].PrevY == 1)
                    ret.push({ x: this.X - 1, y: this.Y - 1 });
            }
        }

        return ret;
    }

    public OnAfterMove()
    {
        if(this.IsWhite)
        {
            if(this.Y == 7)
                this.Board.Promotion(this.X, this.Y);
            if(this.Y == 5 && this.PrevY == 4 && this.X != this.PrevX
                && Board.GetPieceColorAt(this.Board.Pieces, this.X, 4) == "black"
                && this.Board.Pieces[4][this.X] instanceof Pawn
                && this.Board.Pieces[4][this.X].PrevX == this.X
                && this.Board.Pieces[4][this.X].PrevY == 6)
                this.Board.EnPassant(this.X, 4);
        }
        else
        {
            if(this.Y == 0)
                this.Board.Promotion(this.X, this.Y);
            if(this.Y == 2 && this.PrevY == 3 && this.X != this.PrevX
                && Board.GetPieceColorAt(this.Board.Pieces, this.X, 3) == "white"
                && this.Board.Pieces[3][this.X] instanceof Pawn
                && this.Board.Pieces[3][this.X].PrevX == this.X
                && this.Board.Pieces[3][this.X].PrevY == 1)
                this.Board.EnPassant(this.X, 3);
        }
    }

    public Clone(): Piece
    {
        return new Pawn(this.X, this.Y, this.IsWhite, this.Board);
    }
}