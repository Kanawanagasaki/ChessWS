///<reference path="Piece.ts" />
class King extends Piece
{
    public CanCastle:boolean;

    constructor(x:number, y:number, isWhite:boolean, board:Board)
    {
        super(x, y, isWhite, 0, board);
        this.CanCastle = true;
    }

    public GetPossibleMoves(pieces:{[row:number]:{[column:number]:Piece}}): { x: number; y: number; }[]
    {
        let ret:{ x: number; y: number; }[] = [];

        for(let ix = -1; ix <= 1; ix++)
        {
            for(let iy = -1; iy <= 1; iy++)
            {
                if(ix == 0 && iy == 0) continue;
                if(this.X + ix < 0 || this.X + ix > 7 || this.Y + iy < 0 || this.Y + iy > 7) continue;

                if((this.X + ix) in pieces[this.Y + iy])
                {
                    if(pieces[this.Y + iy][this.X + ix].IsWhite != this.IsWhite)
                        ret.push({x:this.X + ix, y:this.Y + iy});
                    continue;
                }

                ret.push({x:this.X + ix, y:this.Y + iy});
            }
        }

        if(this.IsWhite && this.X == 4 && this.Y == 0 && this.CanCastle)
        {
            if(Board.GetCellTypeAt(pieces, 5,0) == "empty" &&
                Board.GetCellTypeAt(pieces, 6,0) == "empty" &&
                Board.GetCellTypeAt(pieces, 7,0) == "white" &&
                pieces[0][7] instanceof Rook &&
                pieces[0][7].CanCastle &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 4, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 5, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 6, 0).length == 0)
                ret.push({x:6, y:0});
            if(Board.GetCellTypeAt(pieces, 3,0) == "empty" &&
                Board.GetCellTypeAt(pieces, 2,0) == "empty" &&
                Board.GetCellTypeAt(pieces, 1,0) == "empty" &&
                Board.GetCellTypeAt(pieces, 0,0) == "white" &&
                pieces[0][0] instanceof Rook &&
                pieces[0][0].CanCastle &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 4, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 3, 0).length == 0 &&
                Board.GetPiecesThatCanMoveTo(pieces, !this.IsWhite, 2, 0).length == 0)
                ret.push({x:2, y:0});
        }
        else if(!this.IsWhite && this.X == 4 && this.Y == 7 && this.CanCastle)
        {
            if(Board.GetCellTypeAt(pieces, 5,7) == "empty" &&
                Board.GetCellTypeAt(pieces, 6,7) == "empty" &&
                Board.GetCellTypeAt(pieces, 7,7) == "black" &&
                pieces[7][7] instanceof Rook &&
                pieces[7][7].CanCastle)
                ret.push({x:6, y:7});
            if(Board.GetCellTypeAt(pieces, 3,7) == "empty" &&
                Board.GetCellTypeAt(pieces, 2,7) == "empty" &&
                Board.GetCellTypeAt(pieces, 1,7) == "empty" &&
                Board.GetCellTypeAt(pieces, 0,7) == "black" &&
                pieces[7][0] instanceof Rook &&
                pieces[7][0].CanCastle)
                ret.push({x:2, y:7});
        }

        return ret;
    }

    public OnAfterMove()
    {
        if(this.CanCastle)
        {
            if(this.IsWhite)
            {
                if(this.PrevX == 4 && this.PrevY == 0)
                {
                    if(this.X == 6 && this.Y == 0)
                        this.Board.Castle(7, 0);
                    else if(this.X == 2 && this.Y == 0)
                        this.Board.Castle(0, 0);
                }
            }
            else
            {
                if(this.PrevX == 4 && this.PrevY == 7)
                {
                    if(this.X == 6 && this.Y == 7)
                        this.Board.Castle(7, 7);
                    else if(this.X == 2 && this.Y == 7)
                        this.Board.Castle(0, 7);
                }
            }
        }

        this.CanCastle = false;
    }

    public Clone(): Piece
    {
        let ret = new King(this.X, this.Y, this.IsWhite, this.Board);;
        ret.CanCastle = this.CanCastle;
        return ret;
    }
}